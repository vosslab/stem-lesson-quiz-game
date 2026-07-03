# File structure

Directory map for stem-lesson-quiz-game. Generated outputs (`dist/`,
`dist-single/`, `node_modules/`) are gitignored.

## Top-level layout

```text
stem-lesson-quiz-game/
+- src/            TypeScript game source (entry point init.ts)
+- data/           stem YAML source and generated JSON bundle
+- artifacts/      source PDFs the stems were extracted from
+- tools/          Python and Node build helpers
+- devel/          developer maintenance scripts
+- tests/          pytest, Playwright, and e2e suites
+- docs/           repo documentation (this file lives here)
+- *.sh            build, serve, and check entry points
`- package.json    Node and npm script config
```

## Root

- [README.md](../README.md) -- project purpose and quick start.
- [AGENTS.md](../AGENTS.md) -- AI agent instructions.
- [VERSION](../VERSION) -- current version string.
- `LICENSE.CC_BY_4_0`, `LICENSE.LGPL_v3` -- dual licensing (content vs code).
- [package.json](../package.json), `package-lock.json`,
  [tsconfig.json](../tsconfig.json), `tsconfig.lint.json` -- Node and TypeScript
  config.
- [Brewfile](../Brewfile), `pip_requirements.txt`, `pip_requirements-dev.txt`,
  `pip_extras.txt` -- dependency manifests.
- `source_me.sh` -- shell bootstrap for Python tooling.
- [setup_game.sh](../setup_game.sh), [run_web_server.sh](../run_web_server.sh),
  [build_github_pages.sh](../build_github_pages.sh),
  [check_codebase.sh](../check_codebase.sh),
  [run_playwright_tests.sh](../run_playwright_tests.sh) -- setup, serve, build,
  and test entry points.

## Source

- [src/](../src/) -- TypeScript game source; entry point
  [src/init.ts](../src/init.ts).
- [src/types/](../src/types/) -- shared TypeScript type declarations.
- [src/index.html](../src/index.html), [src/style.css](../src/style.css) --
  HTML shell and styles copied into `dist/`.

## Data

- [artifacts/](../artifacts/) -- source PDFs (`Stems_Lesson_NN.pdf`).
- [data/stems/](../data/stems/) -- per-lesson YAML, one file per lesson
  (20 lessons).
- [data/stems_all.yaml](../data/stems_all.yaml) -- aggregate YAML view.
- [data/stems_bundle.json](../data/stems_bundle.json) -- generated JSON bundle
  the browser loads.

## Tools

- [tools/extract_stems.py](../tools/extract_stems.py) -- PDF to YAML extractor.
- [tools/yaml_to_json.py](../tools/yaml_to_json.py) -- YAML to JSON bundle
  builder.
- [tools/inline_single_file.py](../tools/inline_single_file.py) -- inlines built
  assets into one HTML.
- [tools/sync_typescript_package_pins.py](../tools/sync_typescript_package_pins.py)
  -- bumps `package.json` dependency pins.
- [tools/html_to_pdf.mjs](../tools/html_to_pdf.mjs) -- HTML to PDF helper.
- [tools/typecheck_lint_stub.ts](../tools/typecheck_lint_stub.ts) -- stub that
  keeps `tsconfig.lint.json` non-empty.

## Devel

- [devel/](../devel/) -- developer maintenance scripts: `setup_typescript.sh`,
  `setup_playwright.sh`, `clean_build.sh`, `dist_clean.sh`, `bump_version.py`,
  and the changelog helpers (`changelog_lib.py`, `rotate_changelog.py`,
  `query_changelog.py`, `commit_changelog.py`).
- [devel/DEVEL_README.md](../devel/DEVEL_README.md) -- notes for the devel
  scripts.

## Tests

- [tests/](../tests/) -- pytest lint and schema suite, `tests/test_*.py` (run with
  `pytest tests/`).
- [tests/playwright/](../tests/playwright/) -- headless browser smoke tests plus
  `_server.mjs` and `repo_root.mjs` helpers.
- [tests/conftest.py](../tests/conftest.py),
  [tests/file_utils.py](../tests/file_utils.py) -- shared helpers.
- [tests/TESTS_README.md](../tests/TESTS_README.md),
  [tests/TESTS_TYPESCRIPT_README.md](../tests/TESTS_TYPESCRIPT_README.md) --
  test-suite notes.

## Documentation

- [docs/](.) -- all repo docs (this file lives here).
- [docs/GAME_USAGE.md](GAME_USAGE.md),
  [docs/COLOR_CONTRAST_ACCESSIBILITY.md](COLOR_CONTRAST_ACCESSIBILITY.md),
  [docs/PALETTE_CONTRAST_AUDIT.md](PALETTE_CONTRAST_AUDIT.md),
  [docs/FUN_VIBES_DESIGN_STYLE.md](FUN_VIBES_DESIGN_STYLE.md),
  [docs/PLAYFUL_TRAINING_GAME_STYLE.md](PLAYFUL_TRAINING_GAME_STYLE.md) --
  game-specific guides. `PALETTE_CONTRAST_AUDIT.md` is the repo's audited
  palette (slot accents).
- [docs/REPO_STYLE.md](REPO_STYLE.md), [docs/PYTHON_STYLE.md](PYTHON_STYLE.md),
  [docs/TYPESCRIPT_STYLE.md](TYPESCRIPT_STYLE.md),
  [docs/MARKDOWN_STYLE.md](MARKDOWN_STYLE.md),
  [docs/PYTEST_STYLE.md](PYTEST_STYLE.md), [docs/E2E_TESTS.md](E2E_TESTS.md),
  [docs/PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md) -- style and process docs.
- [docs/AUTHORS.md](AUTHORS.md), [docs/CHANGELOG.md](CHANGELOG.md),
  [docs/CLAUDE_HOOK_USAGE_GUIDE.md](CLAUDE_HOOK_USAGE_GUIDE.md) -- attribution,
  history, and centrally maintained hook reference.

## Generated (gitignored)

- `dist/` -- GitHub Pages build output.
- `dist-single/` -- portable single-file HTML.
- `node_modules/` -- npm dependencies.
- `test-results/`, `playwright-report/`, `screenshots/theme-matrix/` --
  Playwright run outputs.

## Where to add new work

- Game code: a `src/*.ts` module, imported into the graph from
  [src/init.ts](../src/init.ts) or an existing scene.
- Shared types: [src/types/](../src/types/).
- Build or data helpers: [tools/](../tools/) (Python or Node).
- Tests: `tests/test_*.py` for pytest, `tests/playwright/` for browser smoke,
- Docs: [docs/](.) with a SCREAMING_SNAKE_CASE `.md` filename.

## Known gaps

- Add an `assets/` entry once persistent images or audio land in the repo.
- Confirm the Playwright runner config once `playwright.config.ts` lands at the
  repo root (referenced by `run_playwright_tests.sh`).
