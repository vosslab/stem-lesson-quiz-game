# Usage

How to build, serve, check, export, and regenerate data for the
stem-lesson-quiz-game browser game. For gameplay (modes, controls, screens),
see [GAME_USAGE.md](GAME_USAGE.md). For setup and dependencies, see
[INSTALL.md](INSTALL.md).

Every workflow is a front-door shell script at the repo root; the matching
`npm run` alias just points back at the same script. Run either form.

## Quick start

```bash
./setup_game.sh           # one-time: npm install + initial build
./run_web_server.sh       # build dist/, then serve it on a random port
```

`run_web_server.sh` builds `dist/`, prints the chosen URL (random port in
8000-8999, e.g. `http://localhost:8517/`), and opens a browser when
interactive. Override the port for a stable URL:

```bash
PORT=8123 ./run_web_server.sh
```

## Scripts

| Script | npm alias | What it does |
| --- | --- | --- |
| `./run_web_server.sh` | `npm run serve` | Build `dist/` and serve it locally |
| `./build_github_pages.sh` | `npm run build` | Produce the GitHub Pages `dist/` artifact |
| `./check_codebase.sh` | `npm run check` | Typecheck, lint, format-check, Node unit tests |
| `./setup_game.sh` | `npm run setup` | Install npm deps and run the first build |
| `./export_single_file.sh` | none | Portable one-file HTML build |
| `./run_playwright_tests.sh` | none | Playwright browser smoke tests |
| `./devel/clean_build.sh` | `npm run clean` | Remove build output and caches, keep `node_modules` |

## Build

`build_github_pages.sh` is the canonical production build:

- Wipes and recreates `dist/` from scratch.
- Regenerates `data/stems_bundle.json` from YAML (via `tools/yaml_to_json.py`).
- Typechecks with `tsc --noEmit -p src/tsconfig.json`.
- Bundles `src/init.ts` into `dist/main.js` with esbuild (ESM, minified).
- Copies `src/index.html`, `src/style.css`, and the JSON bundle into `dist/`.
- Writes `dist/.nojekyll` so GitHub Pages serves `_`-prefixed files.

This build never produces single-file output. For a portable one-file build,
use `export_single_file.sh`, which writes `dist-single/stems_quiz.html` (set
`OUTDIR` to change the target). Open it directly:

```bash
./export_single_file.sh
open dist-single/stems_quiz.html
```

## Checks and tests

```bash
./check_codebase.sh       # typecheck + lint + prettier --check + Node unit tests
pytest tests/             # fast Python pytest suite (data + repo lint)
./run_playwright_tests.sh # browser smoke tests (rebuilds dist/ if missing)
```

`check_codebase.sh` runs each step directly (`npx tsc`, `npx eslint`,
`npx prettier`, `node --test`) and prints a PASS/FAIL/SKIP summary. It does not
build `dist/` and does not run Playwright. `run_playwright_tests.sh` accepts
`--build` to force a rebuild and forwards remaining arguments to
`npx playwright test`. See [PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md) for the
browser suite and [E2E_TESTS.md](E2E_TESTS.md) for test conventions.

## Data pipeline

The game loads `data/stems_bundle.json`, generated from per-lesson YAML.

```bash
source source_me.sh && python3 tools/extract_stems.py   # PDFs  -> data/stems/*.yaml
source source_me.sh && python3 tools/yaml_to_json.py    # YAML  -> data/stems_bundle.json
```

- `tools/extract_stems.py` reads `artifacts/Stems_Lesson_NN.pdf`
  (`-i/--input-dir`, default `artifacts`) and writes per-lesson YAML
  (`-o/--output-dir`, default `data/stems`).
- `tools/yaml_to_json.py` reads `data/stems/lesson_NN.yaml` (`-i/--input-dir`)
  and writes `data/stems_bundle.json` (`-o/--output`) plus the combined
  `data/stems_all.yaml` (`--all-yaml`). The build runs this step
  automatically; run it by hand only after editing lesson YAML.

## Inputs and outputs

- Inputs: `artifacts/*.pdf` (source lessons), `data/stems/*.yaml` (per-lesson
  stems), `src/` (TypeScript game source).
- Outputs: `data/stems_bundle.json` (runtime data), `dist/` (GitHub Pages
  artifact), `dist-single/stems_quiz.html` (portable build). All three are
  generated and gitignored.

## Deploy

Pushing to `main` runs the `Deploy Pages` workflow
([.github/workflows/pages.yml](../.github/workflows/pages.yml)): it installs npm deps, runs
`build_github_pages.sh` on Node 22, and publishes `dist/` to GitHub Pages.

`clean_build.sh` wipes `dist/`, `dist-single/`, tool caches, and test outputs
but keeps `node_modules` and `package-lock.json`. For a full reset that also
removes `node_modules`, use `devel/dist_clean.sh`.

## Known gaps

- Verify `tools/extract_stems.py` flags against the current PDF layout when
  lesson PDFs change.
