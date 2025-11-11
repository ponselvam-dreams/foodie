User service (scaffold)

This is a minimal FastAPI-based User service scaffold.
It provides:
- user model (Postgres)
- endpoints: POST /users (create), POST /users/verify (verify credentials), GET /users/{id}
- simple create_tables helper for dev

Run locally (quick start)
- Start Postgres (docker-compose recommended)
- Set environment variables (see .env.example)
- Install dependencies and run uvicorn

See `app/core/config.py` for required env vars.
