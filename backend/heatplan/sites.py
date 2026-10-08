"""Saved sites: DynamoDB when SITES_TABLE is set, a local JSON file otherwise."""

import json
import os
import uuid
from pathlib import Path

LOCAL_FILE = Path(__file__).resolve().parents[2] / ".local" / "sites.json"


def _table():
    import boto3

    return boto3.resource("dynamodb").Table(os.environ["SITES_TABLE"])


def _read_local():
    return json.loads(LOCAL_FILE.read_text(encoding="utf-8")) if LOCAL_FILE.exists() else {}


def _write_local(items):
    LOCAL_FILE.parent.mkdir(exist_ok=True)
    LOCAL_FILE.write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")


def list_sites():
    if os.environ.get("SITES_TABLE"):
        return [json.loads(i["doc"]) for i in _table().scan()["Items"]]
    return list(_read_local().values())


def put_site(site):
    site.setdefault("id", uuid.uuid4().hex[:10])
    if os.environ.get("SITES_TABLE"):
        _table().put_item(Item={"id": site["id"], "doc": json.dumps(site, ensure_ascii=False)})
    else:
        items = _read_local()
        items[site["id"]] = site
        _write_local(items)
    return site


def delete_site(site_id):
    if os.environ.get("SITES_TABLE"):
        _table().delete_item(Key={"id": site_id})
    else:
        items = _read_local()
        items.pop(site_id, None)
        _write_local(items)
