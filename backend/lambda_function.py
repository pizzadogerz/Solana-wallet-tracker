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
    url = f"https://mainnet.helius-rpc.com/v0/addresses/{wallet}/transactions?api-key={api_key}&limit=5&type=SWAP"
    with urllib.request.urlopen(url) as resp:
        txs = json.loads(resp.read())
    swap = txs[0]
    print("timestamp:", swap.get("timestamp"))
    print("tokenTransfers:", json.dumps(swap.get("tokenTransfers"), indent=2))
    print("nativeTransfers:", json.dumps(swap.get("nativeTransfers"), indent=2))
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
    