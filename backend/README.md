# TradeOptimize AI Backend

Backend foundation for TradeOptimize AI built with FastAPI. Phase 1 covers project skeleton, database services, configuration, logging, and health checks.

## Quickstart

```bash
cd backend
docker-compose up -d           # start Postgres, MongoDB, Redis
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /` — service banner
- `GET /api/v1/health` — basic health
- `GET /api/v1/health/detailed` — checks Postgres, MongoDB, Redis

## Environment

Copy `.env.example` to `.env` and adjust as needed.

## Project Layout

See `app/` for FastAPI app, `app/core` for config/logging/db, `app/api/v1` for routers.
