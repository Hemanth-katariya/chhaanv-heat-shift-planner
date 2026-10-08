"""Heat-stress estimate and work/rest limits. Plain arithmetic, no AI."""

LIGHT, MODERATE, HEAVY = "light", "moderate", "heavy"
WORKLOADS = (LIGHT, MODERATE, HEAVY)

GREEN, AMBER, RED = "green", "amber", "red"

# ACGIH TLV screening limits (deg C WBGT, acclimatised workers) for the share of
# each hour spent working: 75-100 %, 50-75 %, 25-50 %. Above the last value work stops.
# Heavy/continuous has no value in the current table; 26.0 is from the 2006 edition.
LIMITS = {
    LIGHT: (31.0, 31.0, 32.0),
    MODERATE: (28.0, 29.0, 30.0),
    HEAVY: (26.0, 27.5, 29.0),
}

# Minutes of work per hour planned for each band (the cautious end of each range).
WORK_MINUTES = (50, 30, 15)


def wbgt_c(temp_c, rh_pct, solar_wm2, wind_ms):
    """Outdoor WBGT from standard weather data (Ono & Tonouchi 2014, used by Japan's MoE)."""
    sr = max(solar_wm2, 0.0) / 1000.0
    return (
        0.735 * temp_c
        + 0.0374 * rh_pct
        + 0.00292 * temp_c * rh_pct
        + 7.619 * sr
        - 4.557 * sr * sr
        - 0.0572 * wind_ms
        - 4.064
    )


def classify(wbgt, workload):
    """Return (level, work minutes per hour) for one hour."""
    for limit, minutes in zip(LIMITS[workload], WORK_MINUTES):
        if wbgt <= limit:
            return (GREEN if minutes == WORK_MINUTES[0] else AMBER), minutes
    return RED, 0


def water_litres(wbgt, level):
    """Drinking water per worker for one hour on site (about a cup every 15-20 min in heat)."""
    if level == AMBER:
        return 1.0
    return 0.75 if wbgt >= 25 else 0.5
