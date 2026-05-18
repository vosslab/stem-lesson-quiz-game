#!/bin/bash
# Serve the built game locally for development and the live podcast preview.
# Builds first, then serves dist/ on http://localhost:8080.

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

node tools/build.mjs

PORT="${1:-8080}"
echo ""
echo "Serving on http://localhost:${PORT}/  (Ctrl-C to stop)"
echo ""
exec python3 -m http.server --directory dist "$PORT"
