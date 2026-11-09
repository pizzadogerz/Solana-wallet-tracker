# Solana Wallet Tracker

Paste any Solana wallet address and see what it holds and how much it has made or lost (PnL) over the last 7 days. Serverless on AWS: static frontend on AWS Amplify, Python Lambda behind API Gateway, DynamoDB cache, on-chain data from Helius.

**Live:** https://main.drcq246sjvyhk.amplifyapp.com

## Tech Stack

- **Frontend:** HTML / CSS / JS (single page, Chart.js from CDN)
- **Backend:** Python (AWS Lambda, ap-southeast-1)
- **Cache:** DynamoDB (`wallet-trades` table, 30-day TTL)
- **API Layer:** API Gateway (HTTP API) — `GET /wallet/{address}`
- **Hosting:** AWS Amplify (auto-deploys from `main`). Moving to S3 + CloudFront once CloudFront is unlocked on the account.
- **Data Sources:** Helius (holdings, prices, transactions), Binance (SOL price per minute)

## Team split

- **pizzadogerz** — frontend (`frontend/`, Amplify deploy)
- **Kalachuchi** — backend (`backend/`, Lambda, API Gateway, DynamoDB)

Shared files (edits require PR + other's approval):
- `sample.json` — API contract
- `README.md`
- `.gitignore`

## Workflow

- Branch off latest `main`, one branch per task
- PR with at least one approval before merge
- Never push to `main` directly

## Project Structure

```
solana-wallet-tracker/
├── frontend/              # Static site — HTML/CSS/JS
│   ├── index.html
│   ├── app.js
│   └── style.css
├── backend/               # Python Lambda
│   ├── lambda_function.py # handler: holdings, trades, PnL
│   ├── cache.py           # DynamoDB load/save
│   ├── requirements.txt
│   └── deploy.sh
├── sample.json            # API response contract — source of truth for field names
├── .gitignore
└── README.md
```

## Architecture Flow

```
User (browser)
   1. AWS Amplify                static frontend
   2. API Gateway (HTTP API)     GET /wallet/{address}
   3. Lambda (Python)
        ├─ DynamoDB              load saved trades + bookmark for this wallet
        ├─ Helius DAS            current holdings + token prices + logos
        ├─ Helius transactions   only trades NEWER than the bookmark (in parallel)
        ├─ Binance               SOL price for every minute a trade happened
        └─ DynamoDB              save trades + new bookmark
   4. JSON response (shape in sample.json)
```

First check of a wallet: ~15–20s (fetches up to 7 days of history).
Repeat check: ~3s (only fetches what's new since last time).

## How PnL is calculated

1. **Find trades.** For each transaction, look at how the wallet's SOL and token balances changed. If one token went up while SOL went down, it's a buy; the reverse is a sell. Moves where both go the same way (transfers, airdrops) are ignored.
2. **Price each trade.** The SOL amount is converted to USD using the SOL price in that exact minute (Binance 1-minute candles).
3. **Weighted average cost.** Each token keeps a pile: total amount and total cost.
   - Buy → add to the pile.
   - Sell → realized PnL = sale value − average cost of what was sold.
   - Selling the whole pile (or more than we saw bought) closes it and counts all proceeds.
4. **Unrealized PnL** = (current price − average cost) × amount still held.
5. **Total PnL** = realized + unrealized.

## Limitations

- **7-day window.** Only trades from the last 7 days count.
- **Up to 1,500 transactions per check** (15 pages) to stay under API Gateway's 30-second limit. Very active bot wallets may not get the full 7 days on the first check.
- **SOL-paired trades only.** Token-for-token swaps (e.g. USDC → BONK) are skipped.
- **Holdings only show priced tokens** (ones Helius has a price for).
- **First check is slow**, repeat checks are fast thanks to the cache.

## Getting Started

1. Clone the repo
2. Get a Helius API key from [helius.dev](https://helius.dev)
3. Backend:
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate          # Windows
   source venv/bin/activate       # Mac/Linux
   pip install python-dotenv boto3
   ```
   Create `backend/.env` with `HELIUS_API_KEY=your_key` (gitignored — never commit it), then run `python lambda_function.py`.
4. Frontend: serve the folder, e.g. `python -m http.server 8787 --directory frontend`, and open http://127.0.0.1:8787
5. On AWS the key lives in the Lambda's environment variables, never in code.

## Status: Ongoing
