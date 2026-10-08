import sys
import unittest
from math import atan
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from heatplan import briefing  # noqa: E402
from heatplan.planner import plan_day  # noqa: E402
from heatplan.wbgt import AMBER, GREEN, LIMITS, MARGIN_C, RED, classify, wbgt_c  # noqa: E402


def day(temps, rh=20, wind=2.0):
    """24 hours of weather with sunshine peaking at 13:00."""
    return [
        {"hour": h, "temp": temps(h), "rh": rh, "wind": wind, "solar": max(0, 900 - 130 * abs(h - 13))}
        for h in range(24)
    ]


HEATWAVE = day(lambda h: 44 - 1.6 * abs(h - 14))
MILD = day(lambda h: 24 - 0.5 * abs(h - 14), rh=40)


class WbgtTest(unittest.TestCase):
    def test_shade_value_matches_psychrometric_wbgt(self):
        # 30 C at 70 % RH has a wet bulb near 25.5 C, so indoor WBGT is about 26.9 C.
        self.assertAlmostEqual(wbgt_c(30, 70, 0, 1), 26.9, delta=0.5)

    def test_shade_values_track_wet_bulb_physics(self):
        # Independent check: indoor WBGT = 0.7 * wet bulb + 0.3 * air, wet bulb from Stull (2011).
        def wet_bulb(t, rh):
            return (
                t * atan(0.151977 * (rh + 8.313659) ** 0.5)
                + atan(t + rh)
                - atan(rh - 1.676331)
                + 0.00391838 * rh**1.5 * atan(0.023101 * rh)
                - 4.686035
            )

        for t in (25, 30, 35, 40, 44):
            for rh in (15, 30, 50, 70, 90):
                diff = wbgt_c(t, rh, 0, 1) - (0.7 * wet_bulb(t, rh) + 0.3 * t)
                self.assertLess(abs(diff), 1.3, (t, rh))
                # Any under-estimate must stay inside the safety margin.
                self.assertGreater(diff, -MARGIN_C, (t, rh))

    def test_sun_and_humidity_raise_it(self):
        self.assertGreater(wbgt_c(35, 40, 800, 1), wbgt_c(35, 40, 0, 1))
        self.assertGreater(wbgt_c(35, 70, 0, 1), wbgt_c(35, 40, 0, 1))

    def test_limits_match_the_acgih_screening_table(self):
        # TLV column, acclimatised workers: 75-100 %, 50-75 %, 25-50 % of each hour working.
        self.assertEqual(LIMITS["light"], (31.0, 31.0, 32.0))
        self.assertEqual(LIMITS["moderate"], (28.0, 29.0, 30.0))
        self.assertEqual(LIMITS["heavy"][1:], (27.5, 29.0))
        # The table has no heavy value for 75-100 %, so ours must not be looser than the next band.
        self.assertLess(LIMITS["heavy"][0], LIMITS["heavy"][1])

    def test_bands_without_margin_follow_the_table(self):
        self.assertEqual(classify(28.0, "moderate", margin=0), (GREEN, 50))
        self.assertEqual(classify(29.0, "moderate", margin=0), (AMBER, 30))
        self.assertEqual(classify(30.0, "moderate", margin=0), (AMBER, 15))
        self.assertEqual(classify(30.1, "moderate", margin=0), (RED, 0))
        self.assertEqual(classify(31.0, "light", margin=0), (GREEN, 50))
        self.assertEqual(classify(32.0, "light", margin=0), (AMBER, 15))
        self.assertEqual(classify(27.5, "heavy", margin=0), (AMBER, 30))
        self.assertEqual(classify(29.1, "heavy", margin=0), (RED, 0))

    def test_bands_are_one_degree_stricter_by_default(self):
        self.assertEqual(MARGIN_C, 1.0)
        self.assertEqual(classify(27.0, "moderate"), (GREEN, 50))
        self.assertEqual(classify(27.5, "moderate"), (AMBER, 30))
        self.assertEqual(classify(28.5, "moderate"), (AMBER, 15))
        self.assertEqual(classify(29.5, "moderate"), (RED, 0))
        self.assertEqual(classify(27.0, "heavy")[0], AMBER)


class PlannerTest(unittest.TestCase):
    def test_mild_day_keeps_the_usual_shift(self):
        plan = plan_day("2026-01-10", MILD, "moderate")
        self.assertFalse(plan["changed"])
        self.assertEqual(plan["planned"]["blocks"], [{"start": 9, "end": 17}])
        self.assertIsNone(plan["stop"])

    def test_heatwave_moves_work_out_of_red_hours(self):
        plan = plan_day("2026-05-19", HEATWAVE, "moderate")
        levels = {h["hour"]: h["level"] for h in plan["hours"]}
        self.assertTrue(plan["changed"])
        self.assertEqual(plan["planned"]["red_hours"], 0)
        self.assertGreater(plan["usual"]["red_hours"], 0)
        self.assertGreater(plan["planned"]["work_min"], plan["usual"]["work_min"])
        for block in plan["planned"]["blocks"]:
            self.assertGreaterEqual(block["start"], 5)
            self.assertLessEqual(block["end"], 20)
            self.assertTrue(all(levels[h] != RED for h in range(block["start"], block["end"])))
        self.assertLessEqual(plan["planned"]["hours_on_site"], 8)

    def test_heavier_work_gets_fewer_safe_minutes(self):
        light = plan_day("d", HEATWAVE, "light")["planned"]["work_min"]
        heavy = plan_day("d", HEATWAVE, "heavy")["planned"]["work_min"]
        self.assertGreater(light, heavy)

    def test_no_safe_hours(self):
        plan = plan_day("d", day(lambda h: 46, rh=40), "heavy")
        self.assertEqual(plan["planned"]["blocks"], [])
        self.assertEqual(plan["water_l_per_worker"], 0)


class BriefingTest(unittest.TestCase):
    def setUp(self):
        self.plan = plan_day("2026-05-19", HEATWAVE, "moderate")

    def test_scripts_carry_every_plan_number(self):
        for lang in ("hi", "en"):
            f = briefing.facts(self.plan, "Tower B", "today", lang)
            script = briefing.template_script(f, lang)
            found = set(__import__("re").findall(r"\d+(?:\.\d+)?", script))
            self.assertLessEqual(briefing._required_numbers(f), found)
            self.assertIn("Tower B", script)

    def test_no_work_script(self):
        plan = plan_day("d", day(lambda h: 46, rh=40), "heavy")
        script = briefing.template_script(briefing.facts(plan, "Tower B", "today", "en"), "en")
        self.assertIn("Work is stopped", script)


if __name__ == "__main__":
    unittest.main()
