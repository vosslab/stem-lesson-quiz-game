# Code architecture

High-level design of the stem-lesson-quiz-game: a static TypeScript browser
game that loads a precomputed JSON bundle and runs entirely client-side.

## Top-level shape

- Data source of truth: per-lesson YAML in `data/stems/` (140 stems across
  20 lessons).
- Build-time bundle: `tools/yaml_to_json.py` collapses the YAML into
  `data/stems_bundle.json`.
- Runtime: `src/init.ts` boots the game; `esbuild` bundles all `src/*.ts`
  into `dist/main.js`; `src/index.html` loads it.
- Distribution: GitHub Pages serves `dist/`; `export_single_file.sh` inlines
  everything into one portable HTML.

## Major TypeScript modules

- Game loop: `init.ts`, `round.ts`, `question_builder.ts`, `scoring.ts`.
- Scene controllers: `scene_home.ts`, `scene_results.ts`, `scene_shop.ts`,
  `scene_mastery.ts`, `scene_goals.ts`, with `screen_state.ts` driving
  transitions.
- Rendering and feedback: `ui_rendering.ts`, `feedback.ts`, `mascot.ts`,
  `confetti.ts`, `slot_palette.ts`, `style.css`.
- Progression and persistence: `coins.ts`, `cosmetics.ts`, `daily_goals.ts`,
  `mastery.ts`, `persist.ts`, `brands.ts`.
- Input and config: `input.ts`, `constants.ts`, `data_loader.ts`,
  `distractor_score.ts`, `mock_bundle.ts`.
- Shared types: `src/types/`.

## Python tools

- `tools/extract_stems.py` -- PDF -> YAML.
- `tools/yaml_to_json.py` -- YAML -> JSON bundle (asserts 20/140).
- `tools/inline_single_file.py` -- inlines built JS/CSS/JSON into one HTML.

## Test layers

- `tests/test_*.py` -- pyflakes, ASCII, indentation, markdown link, init,
  shebang, naming, and stems-schema checks (run with `pytest tests/`).
- `tests/playwright/` -- headless browser smoke checks driven by
  `check_codebase.sh`.

## Data flow

1. Author edits a YAML file under `data/stems/`.
2. `tools/yaml_to_json.py` regenerates `data/stems_bundle.json`.
3. `build_github_pages.sh` typechecks `src/`, bundles `src/init.ts` to
   `dist/main.js`, and copies the bundle into `dist/`.
4. Browser loads `dist/index.html`, which fetches `stems_bundle.json` and
   starts the round loop.

## Known gaps

- Document the ScreenState transition table once it stabilizes.
- Add a diagram for the question-builder distractor scoring path.
