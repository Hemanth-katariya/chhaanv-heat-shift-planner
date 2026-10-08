"""Turn a day of hourly weather into a heat-safe shift."""

from .wbgt import AMBER, GREEN, RED, classify, water_litres, wbgt_c

FIRST_HOUR, LAST_HOUR = 5, 20  # work is only planned between 05:00 and 20:00
SHIFT_HOURS = 8
USUAL_START = 9
MIN_BLOCK = 2
MIDDAY_GAP = 2
SPLIT_GAIN_MIN = 30  # a split shift must add at least this much working time


def rate_hours(weather_hours, workload):
    rated = []
    for h in weather_hours:
        wbgt = round(wbgt_c(h["temp"], h["rh"], h["solar"], h["wind"]), 1)
        level, work_min = classify(wbgt, workload)
        rated.append({**h, "wbgt": wbgt, "level": level, "work_min": work_min})
    return rated


def _summarise(by_hour, blocks):
    hours = [by_hour[h] for start, end in blocks for h in range(start, end) if h in by_hour]
    return {
        "blocks": [{"start": s, "end": e} for s, e in blocks],
        "hours_on_site": len(hours),
        "work_min": sum(h["work_min"] for h in hours),
        "green_hours": sum(h["level"] == GREEN for h in hours),
        "amber_hours": sum(h["level"] == AMBER for h in hours),
        "red_hours": sum(h["level"] == RED for h in hours),
    }


def _best_blocks(by_hour, shift_hours, usual_start):
    ok = lambda a, b: all(h in by_hour and by_hour[h]["level"] != RED for h in range(a, b))
    work = lambda a, b: sum(by_hour[h]["work_min"] for h in range(a, b))
    span = range(FIRST_HOUR, LAST_HOUR + 1)

    singles = [(a, b) for a in span for b in span if b > a and b - a <= shift_hours and ok(a, b)]
    if not singles:
        return []
    key = lambda blocks: (
        sum(work(a, b) for a, b in blocks),
        -abs(blocks[0][0] - usual_start),
    )
    best_single = max(([s] for s in singles), key=key)

    long_enough = [s for s in singles if s[1] - s[0] >= MIN_BLOCK]
    splits = [
        [m, e]
        for m in long_enough
        for e in long_enough
        if e[0] - m[1] >= MIDDAY_GAP and (m[1] - m[0]) + (e[1] - e[0]) <= shift_hours
    ]
    if splits:
        best_split = max(splits, key=key)
        if key(best_split)[0] >= key(best_single)[0] + SPLIT_GAIN_MIN:
            return best_split
    return best_single


def plan_day(day, weather_hours, workload, shift_hours=SHIFT_HOURS, usual_start=USUAL_START):
    rated = rate_hours(weather_hours, workload)
    by_hour = {h["hour"]: h for h in rated}
    window = [h for h in rated if FIRST_HOUR <= h["hour"] < LAST_HOUR]

    blocks = _best_blocks(by_hour, shift_hours, usual_start)
    planned = _summarise(by_hour, blocks)
    usual = _summarise(by_hour, [(usual_start, usual_start + shift_hours)])

    on_site = [by_hour[h] for s, e in blocks for h in range(s, e)]
    water = sum(water_litres(h["wbgt"], h["level"]) for h in on_site)
    peak = max(window, key=lambda h: h["wbgt"]) if window else None

    stop_hours = [h["hour"] for h in window if h["level"] == RED]
    return {
        "date": day,
        "hours": window,
        "planned": planned,
        "usual": usual,
        "changed": planned["blocks"] != usual["blocks"],
        "stop": {"start": stop_hours[0], "end": stop_hours[-1] + 1} if stop_hours else None,
        "peak": peak,
        "water_l_per_worker": round(water * 2 + 0.49) / 2,
        "rest_min": sorted({60 - h["work_min"] for h in on_site}),
    }
