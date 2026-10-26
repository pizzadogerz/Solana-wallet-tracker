import json
import os
import urllib.request

def lambda_handler(event, context):
    api_key = os.environ.get("HELIUS_API_KEY")
    wallet = (event.get("pathParameters") or {}).get("address")
    if not wallet or not (32 <= len(wallet) <= 44):
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "invalid_wallet", "message": "Wallet address is missing or invalid"})
        }


    body = json.dumps({
        "jsonrpc": "2.0",
        "id": "1",
        "method": "getAssetsByOwner",
        "params": {
            "ownerAddress": wallet,
            "page": 1,
            "limit": 100,
            "options": {"showFungible": True, "showNativeBalance": True}
        }
    }).encode()
    req = urllib.request.Request(
        f"https://mainnet.helius-rpc.com/?api-key={api_key}",
        data=body,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read())["result"]
    print("items:", len(result["items"]))
    print("SOL:", result.get("nativeBalance"))
    
    data = {
        "wallet": wallet,
        "asOf": "2026-09-24T04:00:00Z",
        "totalPnlUsd": 140.00,
        "holdings": [
        {
                "mint": "So11111111111111111111111111111111111111112",
                "symbol": "SOL",
                "amount": 12.5,
                "avgCostUsd": 145.20,
                "currentPriceUsd": 162.80,
                "unrealizedPnlUsd": 220.00
         }
        ],
        "history": [
            {"date": "2026-09-22", "portfolioValueUsd": 2521.75},
            {"date": "2026-09-23", "portfolioValueUsd": 2495.20},
            {"date": "2026-09-24", "portfolioValueUsd": 2559.75}
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
    