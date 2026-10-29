import json
import os
import urllib.request
from datetime import datetime, timezone

def lambda_handler(event, context):
    api_key = os.environ.get("HELIUS_API_KEY")
    wallet = (event.get("pathParameters") or {}).get("address")
    if not wallet or not (32 <= len(wallet) <= 44):
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "invalid_wallet", "message": "Wallet address is missing or invalid"})
        }


    items = []
    page = 1
    while True:
        body = json.dumps({
            "jsonrpc": "2.0",
            "id": "1",
            "method": "getAssetsByOwner",
            "params": {
                "ownerAddress": wallet,
                "page": page,
                "limit": 1000,
                "options": {"showFungible": True, "showNativeBalance": True}
            }
        }).encode()
        req = urllib.request.Request(
            f"https://mainnet.helius-rpc.com/?api-key={api_key}",
            data=body,
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                result = json.loads(resp.read())["result"]
        except Exception:
            return {
                "statusCode": 502,
                "headers": {"Access-Control-Allow-Origin": "*"},
                "body": json.dumps({"error": "upstream_error", "message": "Could not fetch wallet data, try again"})
            }
        items += result["items"]
        if page == 1:
            native = result.get("nativeBalance") or {}
        if len(result["items"]) < 1000 or page >= 3:
            break
        page += 1

    holdings = []
    for item in items:
        token_info = item.get("token_info") or {}
        price_info = token_info.get("price_info")
        if not price_info:
            continue
        amount = token_info["balance"] / 10 ** token_info["decimals"]        # raw balance ÷ 10 to the power of decimals
        holdings.append({
            "mint": item["id"],
            "symbol": token_info.get("symbol"),
            "amount": amount,
            "avgCostUsd": 0,
            "currentPriceUsd": price_info["price_per_token"],    # from price_info
            "unrealizedPnlUsd": 0
        })
    if native.get("lamports"):
        holdings.append({
            "mint": "So11111111111111111111111111111111111111112",
            "symbol": "SOL",
            "amount": native["lamports"] / 10 ** 9,
            "avgCostUsd": 0,
            "currentPriceUsd": native["price_per_sol"],
            "unrealizedPnlUsd": 0
        })

    total_value = sum(h["amount"] * h["currentPriceUsd"] for h in holdings)
    now = datetime.now(timezone.utc)
    data = {
        "wallet": wallet,
        "asOf": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totalPnlUsd": 0,
        "holdings": holdings,
        "history": [
            {"date": now.strftime("%Y-%m-%d"), "portfolioValueUsd": total_value}
        ]
    }
    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps(data)
        }

if __name__ == "__main__":
    from dotenv import load_dotenv
    load_dotenv()
    fake_event = {
        "pathParameters": {"address": "CmujpE7gPGTFVVF5R1X2bSxByDjyjCQWmwvTLzW9bG68"}
    }
    print(lambda_handler(fake_event, None))
    