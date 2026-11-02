import json
import time
import boto3

TABLE = "wallet-trades"
KEEP_DAYS = 30          # wallets nobody checks for 30 days get auto-deleted

try:
    table = boto3.resource("dynamodb", region_name="ap-southeast-1").Table(TABLE)
except Exception:
    table = None        # no AWS access (e.g. running locally): cache is off


def load(wallet):
    # returns {"records": [...], "last_sig": "..."} or None if never saved
    if table is None:
        return None
    try:
        item = table.get_item(Key={"wallet": wallet}).get("Item")
    except Exception:
        return None     # table missing or no permission: act like no cache
    if not item:
        return None
    return {"records": json.loads(item["records"]), "last_sig": item["last_sig"]}


def save(wallet, records, last_sig):
    if table is None or not last_sig:
        return
    try:
        table.put_item(Item={
            "wallet": wallet,
            "records": json.dumps(records),     # stored as text, keeps it simple
            "last_sig": last_sig,               # bookmark: newest trade we've seen
            "expires_at": int(time.time()) + KEEP_DAYS * 86400,
        })
    except Exception:
        pass            # saving failed: not fatal, next check just does a full scan