# Release history

Released versions of the stem-lesson-quiz-game with their release dates and notable changes.

The single source of truth for the current version is the repo-root [VERSION](../VERSION) file, kept in CalVer form (`0Y.0M[.PATCH]`).

## v26.07 - 2026-07-02

### Highlights

- Full TypeScript browser quiz game shipped: three game modes (Quick Run 10
  questions, Challenge 25 questions, Endless), per-mode distractor selector
  (4 / 6 / 8 choices) persisted per mode, and a 140-stem question bundle.
- Cosmetic shop grown to 15 themes grouped into Starter, World, Mascot, and
  Ultimate sections, each with a distinct CSS-only motif at rest, tap-to-preview
  on touch, and a buy-confirmation modal to prevent accidental coin spend.
- Daily goals expanded from 3-per-day to 5-per-day with a 15-goal stratified
  draw (2 easy, 2 medium, 1 hard) and completion bonuses (+50 coins at 3 goals,
  +150 at all 5). Goal dispatch centralized into a single `record_event` funnel
  so the compiler flags any unwired goal.
- Mastery screen redesigned as a Wordle-style 2-column trophy view covering all
  20 lessons at a glance, with color-coded tiles, a per-stem detail modal, and a
  Share button.
- Coin economy tuned: lifetime-coins stat, per-streak coin ramp, earlier streak
  tier at 3-in-a-row, mastery bonus, and a round-bonus accuracy threshold
  lowered to 60 percent for realistic kid pacing.
- Score system removed so coins are the single reward number; play HUD, results
  screen, and home stats all drop the score line.
- Build tooling added: `devel/clean_build.sh` (light clean) and
  `devel/dist_clean.sh` (deep reset), plus npm front-door aliases (`check`,
  `build`, `serve`, `clean`, `setup`, `setup:playwright`) mirroring the shell
  scripts.

### Notable fixes

- Global scroll restored on all scenes by replacing `height: 100%; overflow:
  hidden` on `html, body` with `min-height: 100%` and reserving mascot clearance
  padding, instead of the per-scene band-aid.
- Shop preview no longer effectively equips a theme for free: a scene-wide
  revert timer restores the equipped theme after 2.5s, and buy-cancel snapshots
  and restores the previously equipped theme so previews cannot bleed through.
- Defensive save loading added for dead GitHub Pages buttons caused by stale
  localStorage: parse failures fall back to a fresh save, missing top-level keys
  are backfilled, and a tucked-away "Reset save" escape hatch was added.
- GitHub Pages CI unblocked by dropping the macOS-only `md5` cachebust from the
  build so the Ubuntu runner stops failing.
- Mobile layout fixes: "Tap to continue" pinned to the viewport bottom, mascot
  moved to a fixed bottom-left corner so it stops covering the teaching panel,
  smaller feedback badges, and a live "Today: N answered" HUD counter.
- Dark-theme contrast overhauled by routing feedback overlays, chips, and shop
  UI through theme color tokens rather than hardcoded white.
- Toolchain: 34 files reformatted to the prettier 3.9.4 floor, the missing `tsx`
  devDependency declared, and a `typecheck:lint` stub seeded to unblock the gate.

### Compatibility notes

- Save schema advanced through `SAVE_SCHEMA_VERSION` 1 to 2 to 3; v2 saves
  migrate forward (new daily-goal fields seeded with defaults) while v1 saves are
  discarded. Coins, streaks, mastery, owned themes, and goal state are preserved
  across the v2-to-v3 migration.
- Score system removed: `score`, `best_score`, `points_awarded`, and the
  `beat_score` daily goal are gone; `best_score` is dropped from existing saves.
- Retry queue reworked: removed to stop in-round duplicates, then restored as
  mode-gated (off for Quick Run, on for Challenge and Endless with a 10-20
  question resurface gap).
- Root `dist_clean.sh` removed; both cleaners now live under `devel/`.
- Known blocker: the `eslint` gate step still fails because `package.json`
  declares `"type": "commonjs"` while `eslint.config.js` uses ESM imports; this
  CommonJS-vs-ESM gap is deferred to a future pass.

### Validation

- `npx tsc --noEmit` clean and `bash build_github_pages.sh` passing across the
  development cycle (main bundle ~48-53 kb).
- `pytest tests/` green (285-289 tests over the cycle) and both Playwright load
  and quiz smoke tests passing; the theme screenshot matrix captures all 15
  themes.

## Versions

| Version | Date | Notes |
| --- | --- | --- |
| 26.02 | unreleased | Current development version per [VERSION](../VERSION). No tagged release yet. |

## Known gaps

- No git tags exist for any release; all entries above are derived from the working tree.
- Verification task: once a release is tagged, copy its date (from `git log -1 --format=%ai <tag>`) and a one-line summary into the table.
- Verification task: cross-reference [docs/CHANGELOG.md](CHANGELOG.md) day blocks against tags to backfill historical rows.
