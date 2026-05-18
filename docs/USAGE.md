# Usage

How to build, serve, and ship the stem-lesson-quiz-game. For in-game mechanics
(modes, scoring, controls), see [GAME_USAGE.md](GAME_USAGE.md).

## Local development

```bash
./run_web_server.sh       # build + serve on http://localhost:8123/
```

Wraps `build_github_pages.sh` (typecheck + esbuild bundle) and then starts
`http-server` against `dist/`.

## Build artifacts

- `dist/` -- canonical GitHub Pages build (`index.html`, `main.js`,
  `style.css`, `stems_bundle.json`, `.nojekyll`). Produced by
  `build_github_pages.sh`.
- `dist-single/stems_quiz.html` -- portable single-file HTML (CSS, JS, and
  the JSON data bundle inlined). Produced by `export_single_file.sh` via
  `tools/inline_single_file.py`.
- `dist_clean.sh` removes both `dist/` and `dist-single/`.

Hard rule from `build_github_pages.sh`: the GitHub Pages build must not
produce single-file output. Use `export_single_file.sh` for the portable
artifact instead.

## Data pipeline

- `artifacts/Stems_Lesson_NN.pdf` -- source PDFs (one per lesson).
- `tools/extract_stems.py` -- converts PDFs into per-lesson YAML under
  `data/stems/`.
- `data/stems_all.yaml` -- aggregate YAML view.
- `tools/yaml_to_json.py` -- regenerates `data/stems_bundle.json`, asserting
  20 lessons and 140 stems.

## Tests

- `pytest tests/` -- fast Python suite (lint, ASCII, markdown links,
  `tests/test_stems_data.py` schema checks).
- `./check_codebase.sh` -- TypeScript typecheck plus Playwright smoke under
  [tests/playwright/](../tests/playwright).
- E2E conventions live in [E2E_TESTS.md](E2E_TESTS.md) and
  [PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md).

## Known gaps

- Document any CLI flags accepted by `run_web_server.sh` once they exist
  (currently runs with hardcoded port 8123).
- Cross-link release process to `docs/RELEASE_HISTORY.md` once that doc is
  created.
