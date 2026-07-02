# Code architecture

High-level design of the stem-lesson-quiz-game: a static TypeScript browser
game that loads a precomputed JSON bundle and runs entirely client-side.

## Top-level shape

- Data source of truth: per-lesson YAML in [data/stems/](../data/stems/)
  (140 stems across 20 lessons).
- Build-time bundle: [tools/yaml_to_json.py](../tools/yaml_to_json.py)
  collapses the YAML into [data/stems_bundle.json](../data/stems_bundle.json).
- Runtime: [src/init.ts](../src/init.ts) boots the game; `esbuild` bundles the
  `src/*.ts` module graph into `dist/main.js`; [src/index.html](../src/index.html)
  loads it.
- Distribution: GitHub Pages serves `dist/` via
  [build_github_pages.sh](../build_github_pages.sh);

## Major TypeScript modules

- Game loop: [src/init.ts](../src/init.ts), [src/round.ts](../src/round.ts),
  [src/question_builder.ts](../src/question_builder.ts),
  [src/scoring.ts](../src/scoring.ts) (in-round streak counters; `best_streak`
  persisted via `init.ts`).
- Scene controllers: [src/scene_home.ts](../src/scene_home.ts),
  [src/scene_results.ts](../src/scene_results.ts),
  [src/scene_shop.ts](../src/scene_shop.ts),
  [src/scene_mastery.ts](../src/scene_mastery.ts),
  [src/scene_goals.ts](../src/scene_goals.ts), with
  [src/screen_state.ts](../src/screen_state.ts) driving transitions.
- Rendering and feedback: [src/ui_rendering.ts](../src/ui_rendering.ts),
  [src/feedback.ts](../src/feedback.ts), [src/mascot.ts](../src/mascot.ts),
  [src/confetti.ts](../src/confetti.ts),
  [src/slot_palette.ts](../src/slot_palette.ts),
  [src/style.css](../src/style.css).
- Progression and persistence: [src/coins.ts](../src/coins.ts),
  [src/cosmetics.ts](../src/cosmetics.ts),
  [src/daily_goals.ts](../src/daily_goals.ts),
  [src/mastery.ts](../src/mastery.ts), [src/persist.ts](../src/persist.ts),
  [src/brands.ts](../src/brands.ts).
  - [src/daily_goals.ts](../src/daily_goals.ts) exports the per-event handlers
    `record_round_end`, `record_shop_visit`, `record_theme_equipped`,
    `record_lesson_attempted`, and `record_weak_stem_practiced`. Call sites:
    `init.ts` (round end, lesson attempted, weak-stem practiced),
    `scene_shop.ts` (shop visit), `cosmetics.ts` (theme equipped).
- Input and config: [src/input.ts](../src/input.ts),
  [src/constants.ts](../src/constants.ts),
  [src/data_loader.ts](../src/data_loader.ts),
  [src/distractor_score.ts](../src/distractor_score.ts).
- Shared types: [src/types/](../src/types/) (`question.ts`, `save.ts`,
  `screen.ts`, `stem.ts`, `cosmetic.ts`, `daily_goal.ts`).

## Bundle loading

[src/data_loader.ts](../src/data_loader.ts) exposes `load_bundle`, which adapts
the raw JSON into branded `Bundle`/`Lesson`/`Stem` values. It resolves the
bundle two ways:

- Hosted build: `fetch("stems_bundle.json")` from the sibling `dist/` asset.

## Python tools

- [tools/extract_stems.py](../tools/extract_stems.py) -- PDF to YAML.
- [tools/yaml_to_json.py](../tools/yaml_to_json.py) -- YAML to JSON bundle
  (asserts 20 lessons / 140 stems).
- [tools/inline_single_file.py](../tools/inline_single_file.py) -- inlines
  built JS, CSS, and JSON into one HTML.
- [tools/sync_typescript_package_pins.py](../tools/sync_typescript_package_pins.py)
  -- bumps `package.json` dependency pins to the latest npm versions.
- [tools/html_to_pdf.mjs](../tools/html_to_pdf.mjs) -- Node helper for HTML to
  PDF rendering.
- [tools/typecheck_lint_stub.ts](../tools/typecheck_lint_stub.ts) -- placeholder
  `.ts` that keeps `tsconfig.lint.json` from failing with TS18003 while
  `tests/` and `tools/` hold no other TypeScript.

## Save schema versioning

- `SaveSchemaV1` (in [src/types/save.ts](../src/types/save.ts)) is versioned via
  the `SAVE_SCHEMA_VERSION` constant, currently `3`.
- Migrations live in [src/persist.ts](../src/persist.ts) (`migrate_to_v3`, plus
  the earlier v1 to v2 step).
- v1 saves are discarded on load (pre-feature; no real users); v2 saves migrate
  forward by seeding new fields with defaults.
- v3 fields added on top of v2: `lifetime_coins`, `lessons_attempted_ever`,
  `shop_visited_today`, `session_start_theme`, `weak_stems_practiced_today`, and
  `goals_completed_today` (on `StatsToday`).

## Testing and verification

- [check_codebase.sh](../check_codebase.sh) is the no-build gate: `tsc` typecheck
  (`tsconfig.json` and `tsconfig.lint.json`), ESLint (zero warnings), Prettier
  `--check`, and Node `--test` over any `tests/test_*.mjs`.
- [tests/](../tests/) -- pytest lint and schema checks (`tests/test_*.py`): pyflakes, ASCII,
  indentation, markdown link, shebang, naming, and stems-schema (run with
  `pytest tests/`).
- [tests/playwright/](../tests/playwright/) -- headless browser smoke tests
  (`test_load_smoke.mjs`, `test_quiz_smoke.mjs`, theme screenshot matrix) driven
  by [run_playwright_tests.sh](../run_playwright_tests.sh).

## Data flow

1. Author edits a YAML file under [data/stems/](../data/stems/).
2. [tools/yaml_to_json.py](../tools/yaml_to_json.py) regenerates
   [data/stems_bundle.json](../data/stems_bundle.json).
3. [build_github_pages.sh](../build_github_pages.sh) typechecks `src/`, bundles
   `src/init.ts` to `dist/main.js`, and copies the bundle plus HTML and CSS into
   `dist/`.
4. Browser loads `dist/index.html`, which fetches `stems_bundle.json` and starts
   the round loop.

## Extension points

- New scene: add a `scene_*.ts` controller and wire a transition in
  [src/screen_state.ts](../src/screen_state.ts).
- New save field: extend [src/types/save.ts](../src/types/save.ts), bump
  `SAVE_SCHEMA_VERSION`, and add a migration in
  [src/persist.ts](../src/persist.ts).
- New daily goal event: add a handler in
  [src/daily_goals.ts](../src/daily_goals.ts) and call it from the relevant
  scene or `init.ts`.

## Known gaps

- Document the ScreenState transition table once it stabilizes.
- Add a diagram for the question-builder distractor scoring path.
