## 2026-05-17

### Additions and New Features

M2 Phase 1 complete: TypeScript game source (src/ + src/types/), build pipeline (build_github_pages.sh, run_web_server.sh, export_single_file.sh, tools/yaml_to_json.py), Playwright smoke harness, GitHub Pages workflow, direction chip + colored card stripes for stem/meaning pairs, theme catalog with 3 rarity tiers (Base, Rare, Epic), coins/shop/daily-goals/mastery scaffolding, ScreenState machine, daily goal progress tracking + rewards capping, streak bonuses with cycling milestones, and input key binding for fast navigation.

Per-mode distractor count selector: each game mode card (Quick Run / Challenge / Endless) displays a 3-chip row (4 / 6 / 8 choices) inside the card. Tap chip to change count; selection persists per mode in save schema. Cards now render 2x2 (4 choices), 2x3 (6 choices), or 2x4 (8 choices) grids on wider screens. Keyboard input extended to 1-8 keys for choice selection.

Answer feedback redesign: CHOSEN CORRECT is now white + gold outline with checkmark; CHOSEN WRONG is black + hot pink outline with X glyph. REVEALED CORRECT (correct answer shown after wrong pick) also uses white + gold. Sibling buttons dim during feedback so the chosen/revealed buttons stand out unmistakably.

### Behavior or Interface Changes

Replaced home-screen endless-mode checkbox with three game-mode cards (Quick Run 10 questions, Challenge 25 questions, Endless unlimited): cards have distinct per-mode accent colors, large title + tagline, drop shadow, hover scale effect, keyboard shortcuts 1/2/3 for selection. Mode selection is no longer persisted globally; last-selected mode is tracked per session to focus the card on return (last_mode_id in save schema, replacing endless_mode).

RoundConfig now includes choices_per_question field (defaults to 4). Save schema adds last_choices_by_mode field (Record<mode_id, count>) to persist per-mode choice count. Question builder scales confusability sampling cap from hard-coded top-6 to max(6, (count-1)*2) to support up to 8 choices with adequate candidate pool.

### Fixes and Maintenance

Audit pass: removed dead exports (session_start_ms, reset_save_for_tests), eliminated any-cast in show_stem_details, wired record_master_stem() and record_play_seconds(15s) into daily goal tracking, implemented streak_banner_for() with deterministic cycling, replaced innerHTML with createElement for stat-items in scene_home, replaced optional-chain + || 0 defensive patterns in daily_goals with assertion guards, updated shell scripts to use set -euo pipefail, removed unused from-import in extract_stems.py.

### Removals and Deprecations

Removed answer_feedback ScreenState variant (feedback rendered inline); removed tools/build.mjs from tracked files (phantom entry).
