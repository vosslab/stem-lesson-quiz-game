#!/usr/bin/env bash
# build_github_pages.sh - canonical production build for GitHub Pages.
#
# Contract:
#   - Wipes dist/ from scratch.
#   - Type-checks via `tsc --noEmit` (src/tsconfig.json keeps noEmit: true).
#   - Bundles src/init.ts into dist/main.js with esbuild.
#   - Copies src/index.html and src/style.css into dist/.
#   - Creates dist/.nojekyll so GitHub Pages serves files starting with _.
#   - Asserts dist/index.html exists before exiting.
#
# Hard rule: this script must NOT produce single-file output. GitHub Pages
# output and portable export are different artifacts. For a portable
# one-file HTML build, use export_single_file.sh (output goes to
# dist-single/, never to dist/).

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

rm -rf dist
mkdir -p dist

# Regenerate the JSON bundle from the YAML source of truth.
# tools/yaml_to_json.py asserts 20 lessons / 140 stems.
# Relax `set -u` while sourcing source_me.sh (it pulls ~/.bashrc which may
# reference PS1 unbound in non-interactive shells).
set +u
source source_me.sh
set -u
python3 tools/yaml_to_json.py

npx tsc --noEmit -p src/tsconfig.json

npx esbuild src/init.ts \
	--bundle \
	--minify \
	--format=esm \
	--target=es2022 \
	--platform=browser \
	--sourcemap=linked \
	--outfile=dist/main.js

cp src/style.css dist/style.css
cp data/stems_bundle.json dist/stems_bundle.json

cp src/index.html dist/index.html

touch dist/.nojekyll

test -f dist/index.html
test -f dist/main.js
test -f dist/stems_bundle.json

echo "Built dist/ (GitHub Pages-ready)."
