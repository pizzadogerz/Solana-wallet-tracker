import json
import os
import urllib.request
import cache
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

executor = ThreadPoolExecutor(max_workers=2)     # lets us fetch trades while holdings load

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

def fetch_swaps(wallet, api_key, stop_sig=None):
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
        for s in batch:
            if s["signature"] == stop_sig:
                return swaps                        # reached what we already saved, stop
            if s["timestamp"] >= cutoff:
                swaps.append(s)
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

def fetch_sol_prices(start):
    # SOL price for every minute from `start` until now (Binance, free, 1000 minutes per call)
    prices = {}
    start_ms = int(start // 60) * 60 * 1000
    while True:
        url = (
            "https://data-api.binance.vision/api/v3/klines"
            f"?symbol=SOLUSDT&interval=1m&limit=1000&startTime={start_ms}"
        )
        with urllib.request.urlopen(url, timeout=10) as resp:
            candles = json.loads(resp.read())
        for c in candles:
            prices[c[0] // 60000] = float(c[4])      # key = minute number, value = closing price
        if len(candles) < 1000:
            break                                    # reached the current minute
        start_ms = candles[-1][0] + 60000
    return prices

def avg_costs(records, sol_prices):
    piles = {}
    for r in sorted(records[::-1], key=lambda r: r["time"]):    # oldest first (flip first so same-second trades keep order)
        price = sol_prices.get(r["time"] // 60, 0)              # SOL price in that exact minute
        usd = r["sol"] * price                                   # this trade in USD
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


    saved = cache.load(wallet) or {"records": [], "last_sig": None}    # what we saved last time
    swaps_job = executor.submit(fetch_swaps, wallet, api_key, saved["last_sig"])    # only NEW trades

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
    sol_logo = None
    holdings = []

    for item in items:
        token_info = item.get("token_info") or {}
        price_info = token_info.get("price_info")
        if not price_info:
            continue
        amount = token_info["balance"] / 10 ** token_info["decimals"]        # raw balance ÷ 10 to the power of decimals
        logo = ((item.get("content") or {}).get("links") or {}).get("image")   # token logo from Helius, may be missing
        if item["id"] == WSOL_MINT:
            wsol_amount += amount
            sol_logo = logo
            continue
        holdings.append({
            "mint": item["id"],
            "symbol": token_info.get("symbol"),
            "logoUrl": logo,
            "amount": amount,
            "avgCostUsd": 0,
            "currentPriceUsd": price_info["price_per_token"],    # from price_info
            "unrealizedPnlUsd": 0
        })
    if native.get("lamports") or wsol_amount:
        holdings.append({
            "mint": WSOL_MINT,
            "symbol": "SOL",
            "logoUrl": sol_logo,
            "amount": native.get("lamports", 0) / 10 ** 9 + wsol_amount,
            "avgCostUsd": 0,
            "currentPriceUsd": native["price_per_sol"],
            "unrealizedPnlUsd": 0
        })

    total_value = sum(h["amount"] * h["currentPriceUsd"] for h in holdings)

    try:
        swaps = swaps_job.result()                                # wait for the background trades
        new_records = [r for r in (to_record(s, wallet) for s in swaps) if r]
        cutoff = datetime.now(timezone.utc).timestamp() - DAYS * 86400
        records = [r for r in new_records + saved["records"] if r["time"] >= cutoff]   # new + saved, last 7 days only
        last_sig = swaps[0]["signature"] if swaps else saved["last_sig"]               # newest trade = new bookmark
        cache.save(wallet, records, last_sig)
        oldest = min((r["time"] for r in records), default=0)
        piles = avg_costs(records, fetch_sol_prices(oldest)) if records else {}
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
    