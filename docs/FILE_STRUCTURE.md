# File structure

Directory map for stem-lesson-quiz-game. Generated outputs (`dist/`,
`dist-single/`, `node_modules/`) are gitignored.

## Root

- [README.md](../README.md) -- project purpose and quick start.
- [AGENTS.md](../AGENTS.md) -- AI agent instructions.
- [VERSION](../VERSION) -- current version string.
- `LICENSE.CC_BY_4_0`, `LICENSE.LGPL_v3` -- dual licensing (content vs code).
- [package.json](../package.json), `package-lock.json`, `tsconfig.json` --
  Node and TypeScript config.
- [Brewfile](../Brewfile), `pip_requirements.txt`,
  `pip_requirements-dev.txt`, `pip_extras.txt` -- dependency manifests.
- `source_me.sh` -- shell bootstrap for Python tooling.
- `setup_game.sh`, `run_web_server.sh`, `build_github_pages.sh`,
  `export_single_file.sh`, `dist_clean.sh`, `check_codebase.sh` -- build,
  serve, and test entry points.

## Source

- `src/` -- TypeScript game source; entry point `src/init.ts`.
- `src/types/` -- shared TypeScript type declarations.
- `src/index.html`, `src/style.css` -- HTML shell and styles copied into
  `dist/`.

## Data

- `artifacts/` -- source PDFs (`Stems_Lesson_NN.pdf`).
- `data/stems/` -- per-lesson YAML, one file per lesson (20 lessons).
- `data/stems_all.yaml` -- aggregate YAML view.
- `data/stems_bundle.json` -- generated JSON bundle the browser loads.

## Tools

- `tools/extract_stems.py` -- PDF to YAML extractor.
- `tools/yaml_to_json.py` -- YAML to JSON bundle builder.
- `tools/inline_single_file.py` -- inlines built assets into one HTML.

## Tests

- `tests/test_*.py` -- pytest unit and lint suite (run with `pytest tests/`).
- `tests/playwright/` -- headless browser smoke tests.
- `tests/conftest.py`, `tests/git_file_utils.py` -- shared helpers.
- `tests/TESTS_README.md` -- test-suite specific notes.

## Documentation

- `docs/` -- all repo docs (this file lives here).
- `docs/GAME_USAGE.md`, `docs/COLOR_CONTRAST_ACCESSIBILITY.md` --
  game-specific guides.
- `docs/REPO_STYLE.md`, `docs/PYTHON_STYLE.md`, `docs/TYPESCRIPT_STYLE.md`,
  `docs/MARKDOWN_STYLE.md`, `docs/PYTEST_STYLE.md`, `docs/E2E_TESTS.md`,
  `docs/PLAYWRIGHT_USAGE.md` -- style and process docs.
- `docs/AUTHORS.md`, `docs/CHANGELOG.md`, `docs/CLAUDE_HOOK_USAGE_GUIDE.md`
  -- attribution, history, and centrally maintained hook reference.

## Generated (gitignored)

- `dist/` -- GitHub Pages build output.
- `dist-single/` -- portable single-file HTML (`stems_quiz.html`).
- `node_modules/` -- npm dependencies.

## Known gaps

- Add an `assets/` entry once persistent images or audio land in the repo.
- Cross-link `devel/` once its scope is documented.
