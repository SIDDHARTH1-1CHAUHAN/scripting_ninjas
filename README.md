# TradeOptimize AI

TradeOptimize AI is an import-operations control tower that helps teams classify products, model landed cost, check compliance risk, monitor cargo, optimize routes, and plan FX settlement timing.

## What This Repo Contains

- `frontend/`: Next.js 14 dashboard and landing pages.
- `backend/`: FastAPI API gateway and domain services.
- `backend/microservices/hs_classifier/`: Dedicated HS classification microservice.
- `backend/microservices/route_optimizer/`: Route optimization microservice.
- `backend/scripts/`: Utility scripts, including standalone FX forecast script.

## Core Product Modules

- HS Classifier
- AI Assistant
- Landed Cost
- Compliance
- Route Optimizer
- Cargo Locator
- FX Settlement Optimizer (pay at predicted low, receive at predicted high)
- Analytics
- Business Model

## Tech Stack

- Frontend: Next.js 14, React 18, TypeScript, Tailwind CSS, React Query, Recharts, Leaflet
- Backend: FastAPI, Pydantic, SQLAlchemy, Redis, MongoDB, PostgreSQL
- Forecasting/Data: pandas, Prophet, matplotlib, requests
- AI Integrations: Groq, Gemini, MegaLLM (env-driven)

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+ (3.12 also works in this repo)
- Docker + Docker Compose (recommended for local infra/services)

## Quick Start

### 1) Clone and enter the project

```bash
git clone <your-repo-url>
cd scripting_ninjas
```

### 2) Backend setup

```bash
cd backend
cp .env.example .env
```

Update values in `backend/.env` (at minimum your API keys and auth settings).

Start the backend and dependencies with Docker:

```bash
docker compose up -d --build backend hs-classifier route-optimizer postgres mongodb redis
```

Backend API will be available at `http://localhost:8000`.

Optional non-Docker local run:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 3) Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`.

## Environment Variables

Main backend env file: `backend/.env`

Important variables:

- Datastores: `POSTGRES_URL`, `MONGO_URL`, `REDIS_URL`
- Auth: `GOOGLE_CLIENT_ID`, `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES`
- AI Providers: `GROQ_API_KEY`, `GEMINI_API_KEY`, `MEGALLM_API_KEY`
- HS/AI routing: `HS_CLASSIFIER_PROVIDER`, `HS_IMAGE_CLASSIFIER_PROVIDER`
- FX Forecasting: `ALPHA_VANTAGE_API_KEY`

Never put API keys in frontend code. Keep secrets in backend env only.

## API Surface (High Level)

Base prefix: `/api/v1`

- Health: `/health`
- Auth: `/auth/*`
- Assistant: `/assistant/*`
- HS / Classification: `/classify/*`
- Landed Cost: `/landed-cost/*`
- Compliance: `/compliance/*`
- Cargo: `/cargo/*`
- Forex Forecast: `/forex/forecast`
- Analytics: `/analytics/*`
- Business: `/business/*`

## Standalone FX Forecast Script

Path: `backend/scripts/forex_prophet_forecast.py`

The script:

- Fetches FX daily rates from Alpha Vantage
- Trains Prophet
- Forecasts user-defined days
- Plots historical + forecast data
- Marks and prints the minimum predicted rate/date

## Repository Structure

```text
scripting_ninjas/
  backend/
    app/
    microservices/
      hs_classifier/
      route_optimizer/
    scripts/
  frontend/
    src/
      app/
      components/
      hooks/
      lib/
```

## Development Notes

- Current workflow branch in this repo may vary; use feature branches and PRs when possible.
- This repo ignores `.env` files and planning markdown notes by default.
- Keep `*.env.example` committed so setup remains reproducible.

## Troubleshooting

- If frontend cannot reach backend, verify backend is running on `:8000`.
- If FX forecast fails, verify `ALPHA_VANTAGE_API_KEY` and API limits.
- If Prophet backend errors occur, ensure compatible versions from `backend/requirements.txt` are installed.

