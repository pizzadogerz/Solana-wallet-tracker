import json


def lambda_handler(event, context):
    wallet = (event.get("pathParameters") or {}).get("address")
    if not wallet or not (32 <= len(wallet) <= 44):
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "invalid_wallet", "message": "Wallet address is missing or invalid"})
        }
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
    fake_event = {
        "pathParameters": {"address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"}
    }
    print(lambda_handler(fake_event, None))