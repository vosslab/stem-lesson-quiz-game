# stem-lesson-quiz-game

An arcade-style vocabulary trainer for 140 word stems across 20 lessons, built
as a static TypeScript browser game. Aimed at middle-school students learning
Greek and Latin roots; designed for fast play sessions, streak-driven feedback,
coin rewards, and unlockable themes (Blooket-lite, kid-friendly, no accounts).

## How to play

The game offers three modes:

- **Quick Run** (10 questions): rapid session, 4 distractors per question.
- **Challenge** (25 questions): longer session, 6 distractors per question.
- **Endless** (unlimited): marathon mode, 8 distractors per question.

Each mode card displays a 3-chip row to select your preferred distractor count (4/6/8 choices). Your selection persists per mode. Answer buttons show a permanent 8-color slot identity stripe (left edge) plus theme-dependent fill. Correct answers auto-advance after 800ms; wrong answers display a pulsing "Tap to continue" hint so you can read the teaching panel at your own pace. Press Escape or tap the Home button to return to the home screen.

## Quick start

```bash
./setup_game.sh           # one-time: npm install + initial build
./run_web_server.sh       # build + serve on a random port (printed to stdout). PORT=8123 ./run_web_server.sh for a stable URL.
```

To run Playwright smoke tests locally, run `./setup_playwright.sh` once, then `./check_codebase.sh` to typecheck and test.

For a portable, no-server single-file build:

```bash
./export_single_file.sh   # writes dist-single/stems_quiz.html
```

## Documentation

Project docs:

- [docs/GAME_USAGE.md](docs/GAME_USAGE.md): game mechanics, controls, and features.
- [docs/CHANGELOG.md](docs/CHANGELOG.md): dated record of changes to this repo.

Style and process (shared across the maintainer's repos):

- [docs/REPO_STYLE.md](docs/REPO_STYLE.md): repo organization, naming, and changelog rules.
- [docs/PYTHON_STYLE.md](docs/PYTHON_STYLE.md): Python rules used by the extraction pipeline.
- [docs/PYTEST_STYLE.md](docs/PYTEST_STYLE.md): pytest design and failure triage.
- [docs/TYPESCRIPT_STYLE.md](docs/TYPESCRIPT_STYLE.md): TypeScript rules used by the game source.
- [docs/MARKDOWN_STYLE.md](docs/MARKDOWN_STYLE.md): Markdown formatting rules.
- [docs/E2E_TESTS.md](docs/E2E_TESTS.md): non-browser end-to-end conventions.
- [docs/PLAYWRIGHT_USAGE.md](docs/PLAYWRIGHT_USAGE.md): headless browser smoke testing.
- [docs/AUTHORS.md](docs/AUTHORS.md): maintainer attribution.

## Layout

- `artifacts/` -- source PDFs, one per lesson (`Stems_Lesson_NN.pdf`).
- `data/stems/` -- per-lesson YAML extracted from the PDFs (140 stems total).
- `data/stems_bundle.json` -- generated JSON bundle the browser loads at runtime.
- `src/` -- TypeScript game source (entry `src/init.ts`, types in `src/types/`).
- `tools/` -- Python and Node helpers (PDF extractor, YAML-to-JSON, single-file inliner).
- `tests/` -- pytest unit tests + Playwright headless smoke tests.
- `dist/` -- generated GitHub Pages build (gitignored).
- `dist-single/` -- generated portable single-file HTML (gitignored).

## Tests

```bash
pytest tests/                                    # fast Python pytest suite
bash check_codebase.sh                           # typecheck + Playwright smoke
```

Detailed test conventions live in [docs/E2E_TESTS.md](docs/E2E_TESTS.md) and
[docs/PLAYWRIGHT_USAGE.md](docs/PLAYWRIGHT_USAGE.md).
