#!/usr/bin/env bash
# run_web_server.sh - local development preview for the GitHub Pages build.
#
# Always uses the default build_github_pages.sh path. If you want a
# portable HTML build, invoke export_single_file.sh separately; the
# result lands in dist-single/, not in the served dist/ directory.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if [ ! -d node_modules ]; then
	echo "node_modules missing. Run ./setup_game.sh first." >&2
	exit 1
fi

PORT="${PORT:-8123}"

# Rebuild the canonical GitHub Pages artifact into dist/.
./build_github_pages.sh

# Open the browser, then start the static server.
sleep 1 && open "http://localhost:${PORT}/" &
sleep 0.1
python3 -m http.server "${PORT}" --directory dist
