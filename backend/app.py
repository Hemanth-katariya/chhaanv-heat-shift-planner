"""Lambda entry points: the HTTP API and the 5 am daily run."""

import json
import os

from heatplan import briefing, sites
from heatplan.planner import plan_day
from heatplan.weather import REPLAY_DATE, fetch_two_days
from heatplan.wbgt import LIMITS, WORKLOADS

WHEN = ("today", "tomorrow")


class BadRequest(Exception):
    pass


def _site_params(src):
    try:
        lat, lon = float(src["lat"]), float(src["lon"])
    except (KeyError, TypeError, ValueError):
        raise BadRequest("lat and lon are required numbers")
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise BadRequest("lat or lon out of range")
    workload = src.get("workload", "moderate")
    if workload not in WORKLOADS:
        raise BadRequest(f"workload must be one of {', '.join(WORKLOADS)}")
    return lat, lon, workload


def _truthy(value):
    return str(value).lower() in ("1", "true", "yes")


def build_plan(lat, lon, workload, replay, site="the site"):
    timezone, days = fetch_two_days(lat, lon, replay)
    out = []
    for when, (day, hours) in zip(WHEN, sorted(days.items())):
        plan = plan_day(day, hours, workload)
        plan["when"] = when
        plan["scripts"] = {
            lang: briefing.template_script(briefing.facts(plan, site, when, lang), lang) for lang in ("hi", "en")
        }
        out.append(plan)
    return {
        "timezone": timezone,
        "workload": workload,
        "limits_wbgt_c": LIMITS[workload],
        "replay_date": REPLAY_DATE if replay else None,
        "days": out,
    }


def get_plan(query, _body):
    lat, lon, workload = _site_params(query)
    site = (query.get("site") or "the site")[:80]
    return build_plan(lat, lon, workload, _truthy(query.get("replay")), site)


def post_briefing(_query, body):
    lat, lon, workload = _site_params(body)
    lang = "en" if body.get("lang") == "en" else "hi"
    index = 1 if body.get("when") == "tomorrow" else 0
    site = str(body.get("site") or "the site")[:80]
    _, days = fetch_two_days(lat, lon, _truthy(body.get("replay")))
    day, hours = sorted(days.items())[index]
    return briefing.build(plan_day(day, hours, workload), site, WHEN[index], lang)


def get_sites(_query, _body):
    return {"sites": sites.list_sites()}


def post_site(_query, body):
    lat, lon, workload = _site_params(body)
    name = str(body.get("name") or "").strip()[:80]
    if not name:
        raise BadRequest("name is required")
    try:
        crew = max(1, min(int(body.get("crew", 10)), 2000))
    except (TypeError, ValueError):
        raise BadRequest("crew must be a number")
    return sites.put_site({"name": name, "lat": lat, "lon": lon, "workload": workload, "crew": crew})


ROUTES = {
    ("GET", "/plan"): get_plan,
    ("POST", "/briefing"): post_briefing,
    ("GET", "/sites"): get_sites,
    ("POST", "/sites"): post_site,
}


def dispatch(method, path, query, body):
    """Return (status, payload). Shared by Lambda and the local dev server."""
    try:
        if method == "DELETE" and path.startswith("/sites/"):
            sites.delete_site(path.rsplit("/", 1)[1])
            return 200, {"ok": True}
        route = ROUTES.get((method, path))
        if not route:
            return 404, {"error": "not found"}
        return 200, route(query, body)
    except BadRequest as exc:
        return 400, {"error": str(exc)}
    except Exception as exc:
        print(f"error on {method} {path}: {exc!r}")
        return 502, {"error": "Could not build the plan right now. Please try again."}


CONTENT_TYPES = {"html": "text/html", "css": "text/css", "js": "text/javascript"}


def _web_file(path):
    """Serve the web app from S3 so the app and the API share one HTTPS address."""
    import boto3

    key = path.lstrip("/") or "index.html"
    kind = CONTENT_TYPES.get(key.rsplit(".", 1)[-1])
    try:
        if not kind:
            raise KeyError(key)
        body = boto3.client("s3").get_object(Bucket=os.environ["WEB_BUCKET"], Key=key)["Body"].read()
    except Exception:
        return {"statusCode": 404, "headers": {"content-type": "text/plain"}, "body": "Not found"}
    return {
        "statusCode": 200,
        "headers": {"content-type": f"{kind}; charset=utf-8", "cache-control": "max-age=60"},
        "body": body.decode("utf-8"),
    }


def api_handler(event, _context):
    http = event["requestContext"]["http"]
    if not event["rawPath"].startswith("/api/"):
        return _web_file(event["rawPath"])
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}
    path = event["rawPath"].removeprefix("/api")
    status, payload = dispatch(http["method"], path, event.get("queryStringParameters") or {}, body)
    return {
        "statusCode": status,
        "headers": {"content-type": "application/json; charset=utf-8"},
        "body": json.dumps(payload, ensure_ascii=False),
    }


def daily_handler(_event, _context):
    """EventBridge, 05:00 IST: prepare today's plan and Hindi briefing for every saved site."""
    done = 0
    for site in sites.list_sites():
        try:
            today = build_plan(site["lat"], site["lon"], site["workload"], False, site["name"])["days"][0]
            brief = briefing.build(today, site["name"], "today", "hi", use_polly=False)
            site["latest"] = {
                "date": today["date"],
                "blocks": today["planned"]["blocks"],
                "stop": today["stop"],
                "script": brief["script"],
            }
            sites.put_site(site)
            done += 1
        except Exception as exc:
            print(f"daily run failed for {site.get('id')}: {exc!r}")
    return {"sites_updated": done}
