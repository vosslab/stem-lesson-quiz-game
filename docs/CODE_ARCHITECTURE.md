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

- Game loop: `init.ts`, `round.ts`, `question_builder.ts`, `scoring.ts`
  (in-round streak counters; `best_streak` persisted via `init.ts`).
- Scene controllers: `scene_home.ts`, `scene_results.ts`, `scene_shop.ts`,
  `scene_mastery.ts`, `scene_goals.ts`, with `screen_state.ts` driving
  transitions.
- Rendering and feedback: `ui_rendering.ts`, `feedback.ts`, `mascot.ts`,
  `confetti.ts`, `slot_palette.ts`, `style.css`.
- Progression and persistence: `coins.ts`, `cosmetics.ts`, `daily_goals.ts`,
  `mastery.ts`, `persist.ts`, `brands.ts`.
  - `daily_goals.ts` exports the per-event handlers
    `record_round_end`, `record_shop_visit`, `record_theme_equipped`,
    `record_lesson_attempted`, and `record_weak_stem_practiced`. Call sites:
    `init.ts` (round end, lesson attempted, weak-stem practiced),
    `scene_shop.ts` (shop visit), `cosmetics.ts` (theme equipped).
- Input and config: `input.ts`, `constants.ts`, `data_loader.ts`,
  `distractor_score.ts`, `mock_bundle.ts`.
- Shared types: `src/types/`.

## Python tools

- `tools/extract_stems.py` -- PDF -> YAML.
- `tools/yaml_to_json.py` -- YAML -> JSON bundle (asserts 20/140).
- `tools/inline_single_file.py` -- inlines built JS/CSS/JSON into one HTML.

## Save schema versioning

- `SaveSchemaV1` (in `src/types/save.ts`) is versioned via the
  `SAVE_SCHEMA_VERSION` constant; the current version is `3`.
- Migrations live in `src/persist.ts` (`migrate_to_v3`, plus the v1->v2
  step from the prior bump).
- v1 saves are discarded on load (pre-feature; no real users); v2 saves
  migrate forward by seeding the new fields with defaults.
- v3 fields added on top of v2: `lifetime_coins`,
  `lessons_attempted_ever`, `shop_visited_today`, `session_start_theme`,
  `weak_stems_practiced_today`, and `goals_completed_today` (on
  `StatsToday`).

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
