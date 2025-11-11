#!/usr/bin/env bash
# Quick helper to create DB tables for local dev
set -e

env $(cat .env | xargs) python - <<'PY'
from app.db.create_tables import create_all
create_all()
PY
