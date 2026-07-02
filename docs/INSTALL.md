# Install

Setup steps for the stem-lesson-quiz-game TypeScript browser game and its
Python extraction pipeline. Audience: developers and maintainers running the
game locally or building releases.

## System dependencies

- Node.js with `npm` (project pins `typescript`, `esbuild`, `@playwright/test`,
  `http-server`, `prettier`, `eslint` via `package.json`). CI uses Node 22
  (see [.github/workflows/pages.yml](../.github/workflows/pages.yml)).
- Python 3.12 (used by `tools/extract_stems.py` and `tools/yaml_to_json.py`).

## One-time setup

```bash
./setup_game.sh               # npm install + initial GitHub Pages build
./devel/setup_playwright.sh   # only needed if running Playwright smoke tests
```

The `npm run setup` and `npm run setup:playwright` aliases mirror these two
scripts.

`setup_game.sh` runs `npm install` and then `./build_github_pages.sh` so
`dist/` exists before the first server run.

## Python dependencies

- Runtime tools: [pip_requirements.txt](../pip_requirements.txt).
- Developer tools: [pip_requirements-dev.txt](../pip_requirements-dev.txt).
- Optional extras: [pip_extras.txt](../pip_extras.txt).

Install with `pip install -r pip_requirements.txt` (and `-dev` for pytest).

## Verifying the install

Run `./run_web_server.sh`; the script prints the chosen URL (random port in
8000-8999, e.g. `http://localhost:8517/`). Override with
`PORT=8123 ./run_web_server.sh` for a stable URL. For build, test,
and data-pipeline commands, see [USAGE.md](USAGE.md).

## Known gaps

- Confirm the minimum supported Node.js version (CI runs Node 24; `package.json`
  does not pin an `engines` range).
- Confirm whether `devel/setup_playwright.sh` is required on fresh macOS installs
  (browsers may already be installed system-wide).
