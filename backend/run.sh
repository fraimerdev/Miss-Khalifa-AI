#!/usr/bin/env bash
# Production entrypoint for the Miss Khalifa backend.
# Run from the backend/ directory so that the app's relative data paths
# (data/questions, data/user_inputs.csv) resolve correctly.
set -euo pipefail

cd "$(dirname "$0")"

# Activate the virtualenv if present (created during deploy: python3 -m venv .venv)
if [ -f ".venv/bin/activate" ]; then
  # shellcheck disable=SC1091
  source .venv/bin/activate
fi

# --pythonpath src  -> makes app.py and its `from utils...` imports importable
# --preload         -> build the FAISS vector store once, before forking workers
#                      (avoids repeated OpenAI embedding calls per worker)
# 1 worker + threads -> keeps rate-limiting + session state consistent while
#                       still handling concurrent, IO-bound OpenAI requests
exec gunicorn \
  --pythonpath src \
  --bind 127.0.0.1:6001 \
  --workers 1 \
  --threads 8 \
  --timeout 120 \
  --preload \
  --access-logfile - \
  --error-logfile - \
  app:app
