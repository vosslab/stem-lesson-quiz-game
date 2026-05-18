## 2026-05-17

### Additions and New Features

Visible Home button on quiz screen: added touch-friendly "Home" button (min 44x44 px) in top-right corner (.play-corner-nav, .btn-home-quit). Button is outlined style with accent border, subtly positioned, no confirm dialog on click (drops round state). Keyboard Escape binding (bind_play_keys on_home) now has corresponding UI affordance so kids know how to return to home mid-round. Button text is ASCII-only; hover flips background to accent color with white text.

Path B refinement: permanent 8-slot identity via button fill colors (removed theme-dependent btn-1..4 cycling). Implemented warm/cool color alternation (red, green, blue, magenta, orange, teal, purple, yellow-green) for perceptual slot separation across all 8 buttons. Added juicy gloss overlay and inset highlight + shadow for 3D toy-press tactile depth. On :active, buttons translateY down with reduced shadow for press feedback. Redesigned keyboard badge: white background (90% opacity) with dark text, neutral styling independent of button fill. Removed dim-sibling fog during feedback-buttons stay vivid. All 8 fills audited at 5.5:1 contrast vs white text per docs/COLOR_CONTRAST_ACCESSIBILITY.md.

### Behavior or Interface Changes

M2 Phase 1 complete: TypeScript game source (src/ + src/types/), build pipeline (build_github_pages.sh, run_web_server.sh, export_single_file.sh, tools/yaml_to_json.py), Playwright smoke harness, GitHub Pages workflow, direction chip + colored card stripes for stem/meaning pairs, theme catalog with 3 rarity tiers (Base, Rare, Epic), coins/shop/daily-goals/mastery scaffolding, ScreenState machine, daily goal progress tracking + rewards capping, streak bonuses with cycling milestones, and input key binding for fast navigation.

Per-mode distractor count selector: each game mode card (Quick Run / Challenge / Endless) displays a 3-chip row (4 / 6 / 8 choices) inside the card. Tap chip to change count; selection persists per mode in save schema. Cards now render 2x2 (4 choices), 2x3 (6 choices), or 2x4 (8 choices) grids on wider screens. Keyboard input extended to 1-8 keys for choice selection.

Answer feedback redesign: CHOSEN CORRECT is now white + gold outline with checkmark; CHOSEN WRONG is black + hot pink outline with X glyph. REVEALED CORRECT (correct answer shown after wrong pick) also uses white + gold. Sibling buttons dim during feedback so the chosen/revealed buttons stand out unmistakably.

### Behavior or Interface Changes

Replaced home-screen endless-mode checkbox with three game-mode cards (Quick Run 10 questions, Challenge 25 questions, Endless unlimited): cards have distinct per-mode accent colors, large title + tagline, drop shadow, hover scale effect, keyboard shortcuts 1/2/3 for selection. Mode selection is no longer persisted globally; last-selected mode is tracked per session to focus the card on return (last_mode_id in save schema, replacing endless_mode).

Wrong-answer flow now prevents auto-advance: FEEDBACK_WRONG_MS (600ms) gates a minimum wait for shake + glow-in animations; after minimum wait, a pulsing "Tap to continue" hint appears at bottom-center. Student advances only on explicit click, Enter, or Space keypress, allowing self-paced reading of the teaching panel before moving to the next question. Correct answers continue to auto-advance after 800ms (unchanged).

RoundConfig now includes choices_per_question field (defaults to 4). Save schema adds last_choices_by_mode field (Record<mode_id, count>) to persist per-mode choice count. Question builder scales confusability sampling cap from hard-coded top-6 to max(6, (count-1)*2) to support up to 8 choices with adequate candidate pool.

Button feedback per "Refined Path B" architecture: three separate visual channels prevent identity-correctness confusion. (1) PERMANENT slot identity: thick left stripe (8 fixed colors per slot 1-8) + circular keyboard badge with slot number (top-left corner)-both locked across all themes. (2) THEME fill: buttons keep btn-${i%4+1} backgrounds (cycling per theme). (3) TRANSIENT correctness state: feedback is now overlay-only. Correct shows gold border glow + checkmark badge (scale-in animation); wrong shows pink border glow + X badge + shake + brief desaturation. Button fill color NEVER swaps during feedback, eliminating the prior two-greens ambiguity.

### Fixes and Maintenance

Implemented subject-stem deck shuffle to eliminate stem repeats within cycles. SubjectDeck class uses Fisher-Yates shuffle per question cycle; prevents seam collisions (last K stems of previous cycle reappearing in first K of next) via bounded reshuffle retries (K = min(4, floor((pool.length - 1) / 2))).  Retry-queue resurface removes the resurfaced stem from the deck to prevent immediate re-draw. Verified: no repeats within a cycle, seam collisions minimized across 50-pick test runs from 7-stem pool.

Audit pass: removed dead exports (session_start_ms, reset_save_for_tests), eliminated any-cast in show_stem_details, wired record_master_stem() and record_play_seconds(15s) into daily goal tracking, implemented streak_banner_for() with deterministic cycling, replaced innerHTML with createElement for stat-items in scene_home, replaced optional-chain + || 0 defensive patterns in daily_goals with assertion guards, updated shell scripts to use set -euo pipefail, removed unused from-import in extract_stems.py.

### Removals and Deprecations

Removed answer_feedback ScreenState variant (feedback rendered inline); removed tools/build.mjs from tracked files (phantom entry).
