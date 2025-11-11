#!/usr/bin/env bash
set -e

# Quick helper to create DB tables for local dev
export $(grep -v '^#' .env | xargs)
python - <<'PY'
from app.db.create_tables import create_all
create_all()
PY
