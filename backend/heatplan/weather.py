"""Hourly weather from Open-Meteo (free, no API key)."""

import json
import urllib.parse
import urllib.request
from datetime import date, timedelta

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
HOURLY = "temperature_2m,relative_humidity_2m,wind_speed_10m,shortwave_radiation"

# A real heatwave across north and central India, used when today's weather is mild.
REPLAY_DATE = "2026-05-19"


def fetch_two_days(lat, lon, replay=False):
    """Return (timezone, {iso_date: [hour dicts]}) for two consecutive days."""
    params = {
        "latitude": f"{lat:.4f}",
        "longitude": f"{lon:.4f}",
        "hourly": HOURLY,
        "wind_speed_unit": "ms",
        "timezone": "auto",
    }
    if replay:
        start = date.fromisoformat(REPLAY_DATE)
        params["start_date"] = start.isoformat()
        params["end_date"] = (start + timedelta(days=1)).isoformat()
        url = ARCHIVE_URL
    else:
        params["forecast_days"] = "2"
        url = FORECAST_URL

    with urllib.request.urlopen(f"{url}?{urllib.parse.urlencode(params)}", timeout=20) as resp:
        data = json.load(resp)

    h = data["hourly"]
    days = {}
    for i, stamp in enumerate(h["time"]):
        row = {
            "hour": int(stamp[11:13]),
            "temp": h["temperature_2m"][i],
            "rh": h["relative_humidity_2m"][i],
            "wind": h["wind_speed_10m"][i],
            "solar": h["shortwave_radiation"][i],
        }
        if None not in row.values():
            days.setdefault(stamp[:10], []).append(row)
    return data.get("timezone", "UTC"), days
