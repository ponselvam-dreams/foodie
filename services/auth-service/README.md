Auth service (scaffold)

This is a minimal FastAPI-based Auth service scaffold.
It provides:
- user model (Postgres)
- refresh-token model (Postgres) — refresh tokens are stored server-side
- JWT access token issuance + short expiry
- simple endpoints: /signup, /login, /refresh, /introspect, /logout
- a `create_tables.py` helper to initialize DB tables (for dev)

Run locally (quick start)
- Start Postgres and Redis (docker-compose recommended)
- Set environment variables (see .env.example)
- Install dependencies and run uvicorn

Example docker-compose snippet (dev):

version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: auth
      POSTGRES_PASSWORD: auth
      POSTGRES_DB: authdb
    ports:
      - "5432:5432"
    volumes:
      - auth_dbdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  auth_dbdata:

See `app/core/config.py` for required env vars.
