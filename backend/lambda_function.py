import json
import os
import urllib.request
from datetime import datetime, timezone

B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

def is_solana_address(addr):
    num = 0
    for ch in addr:
        if ch not in B58:
            return False
        num = num * 58 + B58.index(ch)
    leading_zeros = len(addr) - len(addr.lstrip("1"))
    byte_len = (num.bit_length() + 7) // 8
    return leading_zeros + byte_len == 32

DAYS = 7
MAX_PAGES = 15     # ~1s per page; keeps us under API Gateway's 30s limit

def fetch_swaps(wallet, api_key):
    cutoff = datetime.now(timezone.utc).timestamp() - DAYS * 86400
    swaps = []
    before = ""
    for page in range(MAX_PAGES):
        url = (
            f"https://mainnet.helius-rpc.com/v0/addresses/{wallet}/transactions"
            f"?api-key={api_key}&limit=100{before}"    # no type=SWAP: bot trades are labelled TRANSFER
        )
        try:
            with urllib.request.urlopen(url, timeout=20) as resp:
                batch = json.loads(resp.read())
        except Exception:
            break                                   # no more swaps found, stop paging
        swaps += [s for s in batch if s["timestamp"] >= cutoff]
        if not batch or batch[-1]["timestamp"] < cutoff:
            break                                   # reached the end or went past 7 days
        before = f"&before={batch[-1]['signature']}"
    return swaps

def net_flows(swap, wallet):
    # use each account's real balance change: works even when Helius doesn't label it a swap
    net = {}
    for a in swap.get("accountData", []):
        if a["account"] == wallet:
            net["SOL"] = net.get("SOL", 0) + a["nativeBalanceChange"] / 10 ** 9
        for t in a.get("tokenBalanceChanges", []):
            if t["userAccount"] == wallet:
                raw = t["rawTokenAmount"]
                mint = "SOL" if t["mint"] == "So11111111111111111111111111111111111111112" else t["mint"]
                net[mint] = net.get(mint, 0) + int(raw["tokenAmount"]) / 10 ** raw["decimals"]
    net = {k: v for k, v in net.items() if abs(v) > 1e-9}
    return net

def to_record(swap, wallet):
    net = net_flows(swap, wallet)
    sol = net.pop("SOL", 0)
    if len(net) != 1 or sol == 0:
        return None
    mint, amount = list(net.items())[0]
    if (amount > 0) == (sol > 0):
        return None     # token and SOL moved the same way: a transfer or airdrop, not a trade
    return {
        "time": swap["timestamp"],
        "mint": mint,
        "side": "buy" if amount > 0 else "sell",
        "amount": abs(amount),
        "sol": abs(sol),
    }

def fetch_sol_prices():
    url = "https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=365&interval=daily"
    req = urllib.request.Request(url, headers={"User-Agent": "wallet-tracker"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read())
    prices = {}
    for ms, price in data["prices"]:
        day = datetime.fromtimestamp(ms / 1000, timezone.utc).strftime("%Y-%m-%d")
        prices[day] = price
    return prices

def avg_costs(records, sol_prices):
    piles = {}
    for r in sorted(records[::-1], key=lambda r: r["time"]):    # oldest first (flip first so same-second trades keep order)
        day = datetime.fromtimestamp(r["time"], timezone.utc).strftime("%Y-%m-%d")
        usd = r["sol"] * sol_prices.get(day, 0)                  # this trade in USD
        pile = piles.setdefault(r["mint"], {"amount": 0, "cost": 0, "realized": 0})

        if r["side"] == "buy":
            pile["cost"] += usd
            pile["amount"] += r["amount"]
        else:
            if pile["amount"] == 0:
                continue                    # sold something we never saw bought, skip
            if r["amount"] >= pile["amount"]:
                # sold everything (or more than we saw bought): close the pile, count all the SOL received
                pile["realized"] += usd - pile["cost"]
                pile["cost"] = 0
                pile["amount"] = 0
            else:
                avg = pile["cost"] / pile["amount"]
                pile["realized"] += usd - r["amount"] * avg
                pile["cost"] -= r["amount"] * avg
                pile["amount"] -= r["amount"]
    return piles

def lambda_handler(event, context):
    api_key = os.environ.get("HELIUS_API_KEY")
    wallet = (event.get("pathParameters") or {}).get("address")
    if not wallet or not is_solana_address(wallet):
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
   
    WSOL_MINT = "So11111111111111111111111111111111111111112"
    wsol_amount = 0
    holdings = []

    for item in items:
        token_info = item.get("token_info") or {}
        price_info = token_info.get("price_info")
        if not price_info:
            continue
        amount = token_info["balance"] / 10 ** token_info["decimals"]        # raw balance ÷ 10 to the power of decimals
        if item["id"] == WSOL_MINT:
            wsol_amount += amount
            continue
        holdings.append({
            "mint": item["id"],
            "symbol": token_info.get("symbol"),
            "amount": amount,
            "avgCostUsd": 0,
            "currentPriceUsd": price_info["price_per_token"],    # from price_info
            "unrealizedPnlUsd": 0
        })
    if native.get("lamports") or wsol_amount:
        holdings.append({
            "mint": WSOL_MINT,
            "symbol": "SOL",
            "amount": native.get("lamports", 0) / 10 ** 9 + wsol_amount,
            "avgCostUsd": 0,
            "currentPriceUsd": native["price_per_sol"],
            "unrealizedPnlUsd": 0
        })

    total_value = sum(h["amount"] * h["currentPriceUsd"] for h in holdings)

    try:
        swaps = fetch_swaps(wallet, api_key)
        records = [r for r in (to_record(s, wallet) for s in swaps) if r]
        piles = avg_costs(records, fetch_sol_prices())
    except Exception:
        piles = {}      # PnL is extra; if it fails, still return holdings

    for h in holdings:
        pile = piles.get(h["mint"])
        if pile and pile["amount"] > 0:
            h["avgCostUsd"] = pile["cost"] / pile["amount"]
            h["unrealizedPnlUsd"] = (h["currentPriceUsd"] - h["avgCostUsd"]) * h["amount"]
    realized_pnl = sum(p["realized"] for p in piles.values())
    total_pnl = realized_pnl + sum(h["unrealizedPnlUsd"] for h in holdings)

    now = datetime.now(timezone.utc)
    data = {
        "wallet": wallet,
        "asOf": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totalPnlUsd": total_pnl,
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
        "pathParameters": {"address": "89HbgWduLwoxcofWpmn1EiF9wEdpgkNDEyPjzZ72mkDi"}
    }
    print(lambda_handler(fake_event, None))
    