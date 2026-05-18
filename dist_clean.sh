#!/usr/bin/env bash
# dist_clean.sh - wipe build artifacts for fresh-start testing.
#
# Removes everything that is gitignored as a build artifact so a subsequent
# build can be exercised end-to-end. Does NOT touch tracked source (src/,
# data/, docs/, tests/, tools/) or node_modules/ (too expensive to
# reinstall). Idempotent: safe to run twice.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# Remove a path if present, log either way. ASCII output only.
remove_path() {
	local target="$1"
	if [ -e "$target" ] || [ -L "$target" ]; then
		rm -rf "$target"
		echo "rm -rf $target"
	else
		echo "not present: $target"
	fi
}

# Build artifacts.
remove_path "dist"
remove_path "dist-single"
remove_path "test-results"
remove_path "data/stems_bundle.json"

# Python caches.
pycache_count=$(find . -type d -name __pycache__ -not -path "./node_modules/*" -print | wc -l | tr -d ' ')
if [ "$pycache_count" -gt 0 ]; then
	find . -type d -name __pycache__ -not -path "./node_modules/*" -exec rm -rf {} +
	echo "rm -rf __pycache__ directories ($pycache_count removed)"
else
	echo "not present: __pycache__ directories"
fi

pyc_count=$(find . -type f -name "*.pyc" -not -path "./node_modules/*" -print | wc -l | tr -d ' ')
if [ "$pyc_count" -gt 0 ]; then
	find . -type f -name "*.pyc" -not -path "./node_modules/*" -delete
	echo "rm *.pyc files ($pyc_count removed)"
else
	echo "not present: *.pyc files"
fi

echo "dist_clean: done. Run ./build_github_pages.sh to regenerate."
