#!/usr/bin/env bash
# export_single_file.sh - portable one-file HTML export.
#
# Produces a self-contained HTML file by bundling src/init.ts as an IIFE
# and inlining the JS, CSS, and stems bundle JSON inside src/index.html.
# The stems bundle is exposed on window.__STEMS_BUNDLE__ so data_loader
# can read it without a fetch() (file:// fetch is blocked in browsers).
#
# Hard rule: this script must NOT replace or mutate dist/. Output goes to
# dist-single/ (or OUTDIR). GitHub Pages and portable artifacts are
# independently buildable.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

if [ ! -d node_modules ]; then
	echo "ERROR: node_modules missing. Run ./setup_game.sh first." >&2
	exit 1
fi

OUTDIR="${OUTDIR:-dist-single}"
OUTPUT="${OUTDIR}/stems_quiz.html"
mkdir -p "${OUTDIR}"

set +u
source source_me.sh
set -u
python3 tools/yaml_to_json.py

npx tsc --noEmit -p src/tsconfig.json

npx esbuild src/init.ts \
	--bundle \
	--minify \
	--format=iife \
	--target=es2022 \
	--platform=browser \
	--outfile=_bundle.js

# Use Python to inline assets safely (multiline + special chars survive).
python3 tools/inline_single_file.py \
	--index src/index.html \
	--style src/style.css \
	--app _bundle.js \
	--bundle data/stems_bundle.json \
	--output "${OUTPUT}"

rm -f _bundle.js

echo "Wrote ${OUTPUT}"
echo "Open with: open ${OUTPUT}"
