# Solana Wallet Tracker

A serverless Solana transaction tracker. Frontend on S3 + CloudFront, Python Lambda backend via API Gateway, DynamoDB caching, and Helius API for on-chain Solana data.

## Tech Stack

- **Frontend:** HTML / CSS / JS (single page)
- **Backend:** Python (AWS Lambda)
- **Cache:** DynamoDB
- **API Layer:** API Gateway (HTTP API)
- **Hosting:** S3 + CloudFront
- **Data Source:** Helius API (Solana transactions)

## Team split

- **pizzadogerz** — frontend (`frontend/`, S3 + CloudFront deploy)
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
├── frontend/            # Static site — HTML/CSS/JS, Chart.js from CDN
│   ├── index.html
│   ├── app.js
│   └── style.css
├── backend/             # Python Lambda
│   ├── lambda_function.py
│   ├── requirements.txt
│   └── deploy.sh
├── sample.json          # API response contract — source of truth for field names
├── .gitignore
└── README.md
```

## Architecture Flow

```
User (browser)
   1. S3 + CloudFront (static frontend)
   2. API Gateway (HTTP API)
   3. Lambda (Python)
   4. DynamoDB (cache check/write)
   5. Helius API (Solana tx data, on cache miss)
```

## Getting Started

1. Clone the repo
2. Backend: set up a Python virtual environment in `backend/`
3. Get a Helius API key from [helius.dev](https://helius.dev) and store it as an environment variable (never commit it)
4. Frontend: open `frontend/index.html` locally or serve it with a simple dev server

## Status: Ongoing
