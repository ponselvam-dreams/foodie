# Backend — Running Locally

## Running the backend (app local, services in containers)

Prerequisites
- Docker & Docker CLI
- GNU Make
- Python 3.9+ and pip
- Optional: virtualenv

Quick steps (Makefile-driven)
1. Clone and enter repo
```bash
git clone <repo-url>
cd foodie
```

2. Inspect Makefile
```bash
make help   # or: cat Makefile
```

3. (Optional) Build database and redis images
```bash
make build_db
make build_redis
```

4. Local Python virtualenv and dependencies (Makefile has no install target)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

5. Start containerized services only
```bash
make run_db
make run_redis
```

6. Start backend app (starts DB and Redis if needed, then runs Uvicorn locally)
```bash
make run_backend
# This invokes run_db and run_redis, then runs: cd backend && uvicorn app.main:app --reload
```

7. Database / migrations (Alembic targets present in Makefile)
```bash
make db_init         # initialize alembic (if needed)
make db_migration    # create autogen migration
make db_upgrade      # apply migrations (upgrade head)
make db_downgrade    # downgrade one revision
```

8. Redis debugging
```bash
make redis_cli       # runs: docker exec -it foodieairedis redis-cli -a foodieai@123
```

Stopping and cleanup
```bash
make stop_db         # stop PostgreSQL container
make stop_redis      # stop Redis container
make clean_all       # stop/remove DB & Redis containers, images, and volumes
```

Notes
- The backend runs locally via Uvicorn; DB and Redis run in containers named foodieaipg and foodieairedis (ports 5432 and 6379).
- Ensure your .env (or DATABASE_URL / REDIS_URL) points to the container hostnames and ports used above.

