# Install

Setup steps for the stem-lesson-quiz-game TypeScript browser game and its
Python extraction pipeline. Audience: developers and maintainers running the
game locally or building releases.

## System dependencies

- Node.js with `npm` (project pins `typescript`, `esbuild`, `@playwright/test`,
  `http-server`, `prettier`, `eslint` via `package.json`).
- Python 3.12 (used by `tools/extract_stems.py` and `tools/yaml_to_json.py`).
- Homebrew packages listed in [Brewfile](../Brewfile).

## One-time setup

```bash
./setup_game.sh           # npm install + initial GitHub Pages build
./setup_playwright.sh     # only needed if running Playwright smoke tests
```

`setup_game.sh` runs `npm install` and then `./build_github_pages.sh` so
`dist/` exists before the first server run.

## Python dependencies

- Runtime tools: [pip_requirements.txt](../pip_requirements.txt).
- Developer tools: [pip_requirements-dev.txt](../pip_requirements-dev.txt).
- Optional extras: [pip_extras.txt](../pip_extras.txt).

Install with `pip install -r pip_requirements.txt` (and `-dev` for pytest).

## Verifying the install

Run `./run_web_server.sh` and load `http://localhost:8123/`. For build, test,
and data-pipeline commands, see [USAGE.md](USAGE.md).

## Known gaps

- Document minimum Node.js version once verified against CI.
- Confirm whether `setup_playwright.sh` is required on fresh macOS installs
  (browsers may already be installed system-wide).
