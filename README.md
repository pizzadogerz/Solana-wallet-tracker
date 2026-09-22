# Solana Wallet Tracker

A serverless Solana transaction tracker. Frontend on S3 + CloudFront, Python Lambda backend via API Gateway, DynamoDB caching, and the Helius API for on-chain Solana data.

## Tech Stack

- **Frontend:** HTML / CSS / JS (single page)
- **Backend:** Python (AWS Lambda)
- **Cache:** DynamoDB
- **API Layer:** API Gateway (HTTP API)
- **Hosting:** S3 + CloudFront
- **Data Source:** Helius API (Solana transactions)

## Project Structure

```
solana-wallet-tracker/
├── frontend/       # HTML/CSS/JS static site
├── backend/        # Lambda function(s)
├── infra/          # IaC templates (SAM/CDK/Terraform - TBD)
├── .gitignore
└── README.md
```

## Architecture Flow

```
User (browser)
   -> S3 + CloudFront (static frontend)
   -> API Gateway (HTTP API)
   -> Lambda (Python)
   -> DynamoDB (cache check/write)
   -> Helius API (Solana tx data, on cache miss)
```

## Getting Started

1. Clone the repo
2. Backend: set up a Python virtual environment in `backend/`
3. Get a Helius API key from [helius.dev](https://helius.dev) and store it as an environment variable (never commit it)
4. Frontend: open `frontend/index.html` locally or serve it with a simple dev server

## Status

🚧 Early setup — architecture planned, build starting.
