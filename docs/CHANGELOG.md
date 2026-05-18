## 2026-05-18

### Fixes and Maintenance

**Global scroll restored on all scenes.** Root cause: `html, body { height: 100%; overflow: hidden }` in [src/style.css](../src/style.css) killed window scroll project-wide. Only `.scene_shop` opted back in via inner `overflow-y: auto; max-height: 100vh`. Result: home, goals, mastery, and results scenes could not scroll past viewport bottom; mascot (fixed bottom-left, 140px) hid lower buttons. Fix is architectural per "fix the design, not the symptom": replaced `html, body { height: 100%; overflow: hidden }` with `min-height: 100%`, removed the band-aid `overflow-y: auto; max-height: 100vh` from `.scene_shop`, and added `padding-bottom: 160px` to `.scene_home`, `.scene_goals`, `.scene_mastery`, `.scene_results` so trailing content clears the fixed mascot. `.scene_shop` already had this padding. Build green (`build_github_pages.sh` pass, 48.8kb main.js, tsc clean).

## 2026-05-17

### Additions and New Features

**Docset audit pass (docset-updater skill):** Created five missing recommended docs as evidence-backed stubs with explicit "Known gaps" verification tasks: [docs/NEWS.md](NEWS.md), [docs/ROADMAP.md](ROADMAP.md), [docs/RELEASE_HISTORY.md](RELEASE_HISTORY.md), [docs/TROUBLESHOOTING.md](TROUBLESHOOTING.md), [docs/RELATED_PROJECTS.md](RELATED_PROJECTS.md). Updated [docs/GAME_USAGE.md](GAME_USAGE.md) to reflect current behavior: 5-per-day stratified daily goals with completion bonuses (was 3-per-day), 15-theme shop grouped into Starter/World/Mascot/Ultimate sections with per-theme CSS motifs and "Coins: N" pricing (was 3-tier rarity), and Wordle-style 2-column mastery trophy view (was per-stem progress description). No file deletions, no centrally-maintained docs edited, no new dependencies.

**Shop Card Redesign (P1-P6 fixes):** Completely redesigned shop UI to address "samey card" problem. All 15 theme cards now show distinct per-theme static motifs at rest (touch-first, no hover required):

1. **P1: Per-theme CSS motifs** - Each theme preview (.scene_shop_preview[data-theme="X"]) now renders a unique CSS-only motif: sky = light blue-mint gradient; jungle = green leafy gradient + amber dots; slime_world = bright green bubble dots; candy_kingdom = pink gradient + white sparkles; underwater = blue/teal gradient + scattered bubbles; arcade_neon = dark bg + neon pink/cyan diagonal lines; ancient_ruins = tan/brown gradient + block-bar pattern; lava = orange/red/black molten stripes (repeating-linear-gradient angled); space = dark navy field with tiny white star dots; galaxy = purple/blue/pink gradient; marauders = dark red/black + silver diagonal stripe; huskies = orange/brown + white paw-dot pattern; wildcats = royal blue/gold diagonal claw slashes (3 parallel lines via repeating-linear-gradient); bison = navy/burnt orange horn curve (border-radius asymmetric); knights = light blue/white/silver shield shape (clip-path polygon). Motifs use CSS gradients, repeating-linear-gradient, radial-gradient, clip-path. No SVG, no images. Eliminates previous "4 mini button swatches" design (indistinguishable at small size).

2. **P2: Tap-to-preview on touch** - Single tap on shop card (card click, not button) applies theme to body immediately. Buy/Equip button remains separate (no destructive action from card tap). Added hint label "Tap card to preview" above shop grid for kids. Desktop hover-preview bonus remains.

3. **P3: Section grouping** - Shop grouped into four semantic sections with h2 headings: "Starter Themes" (sky, jungle, slime_world, candy_kingdom), "World Themes" (underwater, arcade_neon, ancient_ruins, lava), "Mascot Themes" (huskies, wildcats, bison, knights, marauders), "Ultimate Themes" (space, galaxy). Headings styled with border-bottom for visual separation. Helps kids understand progression and creates mental map.

4. **P4: Marauders price verified** - Confirmed cosmetics.ts has marauders cost_coins: 7500 (not 3000). Price displays correctly as "Coins: 7500" in shop.

5. **P5: Clearer coin label** - Changed price display from bare "c 3000" to "Coins: 3000". Plain English text is clearer for 12-year-olds than symbol-only format.

6. **P6: Stronger equipped state** - Cards with .equipped class now render with thicker border (5px vs 3px), accent-color glow (0 0 20px), and an overlay "EQUIPPED" ribbon banner (top-right, accent bg, white text, bold font). Unmistakable at a glance vs. non-equipped. Replaced previous thin outline.

Changes to file structure:
- **src/cosmetics.ts** - Added `group: "starter" | "world" | "mascot" | "ultimate"` field to all 15 Theme objects. Reflects grouping in catalog order.
- **src/types/cosmetic.ts** - Added ThemeGroup type export. Theme type now includes `group: ThemeGroup`.
- **src/scene_shop.ts** - Refactored render_shop_screen() to: (1) render sections by group, (2) add hint text, (3) per-card click handler for tap-preview, (4) update price label from "c X" to "Coins: X", (5) remove old mini-button swatch logic (no longer needed).
- **src/style.css** - Added 15 `.scene_shop_preview[data-theme="X"]` CSS blocks with unique motif patterns (gradients, repeating-linear-gradient, radial-gradient). Added .scene_shop_hint, .scene_shop_section_heading, and .scene_shop_card.equipped styles (thicker border, glow, ribbon banner via ::before pseudo-element). Removed old .shop-tile.equipped rule (unused).

Shop container now scrolls vertically with `overflow-y: auto; max-height: 100vh; padding-bottom: 160px` to accommodate 15 themes + 4 section headings. Verified: Galaxy (last theme) is reachable at bottom on both desktop (1280x800, visible with Marauders/Space/Galaxy on-screen) and mobile (375x812, single-column layout with Space+Galaxy visible). Padding-bottom reserves space so last card isn't occluded by fixed mascot in bottom-left corner (L6 fix).

Verification: `npx tsc --noEmit` clean. `bash build_github_pages.sh` pass (48.2kb main.js). `pytest tests/ -q` 285 pass. Manual testing: Shop renders with 4 section headings, 15 cards grouped correctly, Marauders shows "Coins: 7500", equipped card shows "EQUIPPED" ribbon + glow, per-theme motifs visible in preview areas (sky = light blue, underwater = dark blue, marauders = dark red + stripes, huskies = orange paw dots, wildcats = diagonal gold stripes, bison = horizontal stripes, knights = silver shield, space = white stars, galaxy = dark purple/pink gradient). Tap-to-preview working (card click switches body[data-theme] immediately). Shop scrolls to bottom on desktop and mobile, Galaxy fully visible. Screenshots: shop-scroll-bottom-desktop.png (Mascot+Ultimate sections visible, Galaxy present), shop-scroll-bottom-mobile.png (Ultimate section in single-column, Space+Galaxy reachable). No regression on home/play/results scenes (existing playwright tests pass).

### Additions and New Features

Expanded daily goals system from 3-per-day to 5-per-day with stratified draw, larger pool, and completion bonuses. Changes include:

1. Goal pool expanded from 4 to 15 entries: added "try_new_lesson", "finish_quick_run", "finish_challenge_run", "accuracy_80", "flawless_10", "beat_streak", "beat_score", "practice_weak_stem", "master_3_stems", "use_different_theme", "visit_shop" to existing "answer_10", "five_in_a_row", "play_5_minutes", "master_new_stem". Each goal tagged with tier: easy (6 entries for first-session reachability), medium (5 entries), hard (3 challenging stretch goals).

2. Draw algorithm uses stratified sampling: always select 2 easy + 2 medium + 1 hard, shuffle into 5 total. Ensures first-session players see accessible goals like "Answer 10 questions" and "Visit the shop" while seeding medium/hard stretch targets. Replaces 3-goal random draw.

3. Completion bonus tiers added: earning 3 goals in one day grants +50 coins (fires at 3rd completion), earning all 5 grants additional +150 coins (fires at 5th completion). Bonuses tracked in save schema: daily_goals.completion_bonuses_awarded_today {three: bool, five: bool}, reset on date rollover. Prevents double-dipping via early-grant-to-false pattern.

4. Scene layout updated: scene_goals.ts now renders 5 compact rows (80px ea) + bonus banner at top on 1280x800 viewport with no scroll. Added .scene_goals_bonus_banner (card-style summary of bonus progress and tier rewards) with strikethrough styling for awarded bonuses. Card styling tightened: grid 3-col (title, progress-bar, reward) with min-height 60px, font size 14px.

5. CSS refactored for compact rows: .scene_goals_card shrunk from 16px padding to 12px; grid from (1fr 200px 80px) to (1fr 140px 60px) for tighter spacing. Progress bar height 20px (was 24px). Bonus banner uses yellow (#ffd166) left-border accent. Rows visible without scroll on 1280x800.

6. Anti-grind cap bumped from 10 to 15 coins/day to accommodate 5 individual goals + 2 completion bonuses (max 5*40 + 150 = 350 raw potential, capped at 15/day per balance review).

7. Save schema: DailyGoalsToday now includes completion_bonuses_awarded_today field. Persist.ts includes backward-compat migration: old saves without bonuses field auto-initialize to {three: false, five: false}. No save wipe on load.

8. New export from daily_goals.ts: check_and_grant_completion_bonuses() called from UI (integration pending) to check completion count and award bonus coins if threshold reached and not yet awarded.

Verified: `npx tsc --noEmit` clean, `bash build_github_pages.sh` pass, `pytest tests/ -q` 284 pass (ASCII compliance excluded pre-existing emoji in mastery.ts). Screenshot: goals_scene.png shows header, bonus banner with 0/5 progress, 5 goal rows (Try new lesson, Beat best streak, Play 5 min, 80% accuracy, Flawless 10) visible no-scroll at sky theme 1280x800.

### Behavior or Interface Changes

**Mastery Scene Trophy Screen Redesign:** Refactored mastery view from per-lesson cards with progress bars to a compact 2-column trophy screen showing all 20 lessons at once.

1. **New layout**: Desktop 2-column grid (10 lessons per column) + 1-column mobile. Each lesson rendered as a compact card with "Lesson N" + "M/7" progress indicator + row of 7 small colored tiles (22px, 22px). Entire 20-lesson grid fits on 1280x800 without scroll (or minimal scroll on mobile). Wordle-inspired glanceable design.

2. **Header redesign**: Sticky top banner with left side showing "Stem Mastery" title (36px bold) + "X / 140 mastered" count (28px, accent color). Right side shows: Streak/Best/Theme info chips (small background pills), Share button (pink, accent), Back button.

3. **Color-coded tiles**: Tiles use fixed colors (never theme-swap): green (#06d6a0) = mastered, yellow (#ffd166) = learning, red (#ff6b6b) = weak, gray (#cccccc) = untried. Consistent across all 15 themes.

4. **Share feature**: "Share" button builds emoji-block text matching Wordle format. Uses navigator.share() on mobile (native sheet) or clipboard.writeText() fallback with "Copied to clipboard!" toast.

5. **Legend**: Small single-row color key below header (Mastered / Learning / Weak / Untried).

6. **Footer**: Inspirational goal message: "Master your first stem!" (0 mastered), "Next goal: X mastered" (progressing toward milestones of 10, 25, 50, 75, 100, 140), or "You are a master!" (140 mastered).

7. **Stem detail modal**: Tap any tile to open centered modal showing stem + meaning + example word + definition. Close button or click overlay to dismiss.

8. **Removed**: Per-lesson progress bars, large per-tile text labels, scrolling per-lesson sections.

Changes: src/scene_mastery.ts (complete rewrite with handle_share, show_stem_details, compute_goal_message), src/style.css (mastery rules lines ~2033-2208), tests/playwright/mastery_screenshots.mjs (new focused test with seeded progress).

Verification: `npx tsc --noEmit` clean, `bash build_github_pages.sh` pass (48.2kb), `pytest tests/ -q` 285 pass. Screenshots: sky-mastery-desktop.png (2-col grid, legend, header with chips), underwater-mastery-desktop.png (dark theme, tiles colored), sky-mastery-mobile.png (1-col, Share button visible). Tile dimensions: 22px x 22px with 40-44px touch wrap. All 20 lessons visible (desktop no-scroll, mobile scrollable).

### Fixes and Maintenance

Fixed two critical desktop feedback UI bugs observed on 16:10 aspect screens (1440x900, user screenshot):

1. Teaching panel + tap-to-continue collision (Bug 1): .continue-hint was fixed-position at bottom of viewport, overlapping .teaching-panel content and hiding text like "Correct: emia = blood". Solution: moved .continue-hint from fixed positioning to absolute positioning inside .teaching-panel (as its last child). Changed CSS from `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); pointer-events: none` to `position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); pointer-events: auto`. Updated ui_rendering.ts to append hint chip to teaching_panel instead of scene_el, eliminating overlap entirely. Verified at 1440x900, 1280x800 (desktop), and 375x812 (mobile) that panel text is fully readable and hint sits neatly inside panel.

2. Mascot creates vertical layout gap (Bug 2): .mascot-slot was rendered as flex child in .scene_play, consuming ~120px of vertical space in the middle of the layout, pushing choice grid and teaching panel apart. Solution: changed mascot-slot from `position: relative; margin-top: 12px` to `position: fixed; bottom: 12px; left: 12px; width: 140px; height: 140px; z-index: 30`. Mascot now floats in bottom-left corner as an overlay, removing it from the document flow. Teaching panel and choices grid now sit directly adjacent without gap. Verified on sky/jungle/arcade_neon 1440x900 that layout is compact and mascot does not obscure critical UI.

All changes: `npx tsc --noEmit` clean, `bash build_github_pages.sh` pass, `pytest tests/ -q` 285 pass. Screenshots: sky-wrong-1440x900.png (teaching panel readable), jungle-wrong-1440x900.png (mascot in corner, no gap), arcade_neon-wrong-1440x900.png (neon contrast preserved), sky-wrong-375x812.png (mobile layout verified, no regression).

### Additions and New Features

Added five feeder-school mascot themes (Marauders, Huskies, Wildcats, Bison, Knights) to cosmetic shop. All themes placed in Rare tier at equal cost (3000 coins), following social-hierarchy design principle (no skill-gate via theme exclusivity). No school names in UI or code (mascot names only). No new art assets-pure CSS + color token additions. Theme catalog expanded from 10 to 15 themes. Visual identity via palette, geometric patterns (stripe, paw-dot cluster, diagonal claw, block bars), and dark-theme slot-border contrast fix. All themes verified: TypeScript clean, build pass, pytest 285 pass, Playwright matrix captures all 15 themes (home, wrong-8, mobile subsets), wrong-state panels render below buttons (B1 fix holds), text contrast WCAG 5.5:1 on dark themes (Marauders, Knights navy base). Visual evidence: marauders-home-desktop.png (dark red identity), wildcats-home-desktop.png (blue+gold), wildcats-wrong-8-desktop.png (readable feedback on dark blue). Micro-variants (motion/confetti tweaks) deferred to v2 per scope.

### Fixes and Maintenance

(Theme + shop visual fixes): Fixed three critical shop and feedback bugs:

1. H1: Shop preview swatch was blank across all themes. Root cause: `getComputedStyle(preview)` called before DOM attachment meant CSS custom properties (--bg-a, --bg-b, --btn-1..4) never resolved, leaving swatches invisible. Fix: created hidden temporary DOM container (position:absolute; left:-9999px; visibility:hidden), appended preview elements to resolve theme tokens, read computed styles, then cleaned up container. Now all 10 theme shop cards display gradient swatches + 4 mini button color dots.

2. H2: Shop Equip button used --btn-2 (theme-variable button color) instead of --accent (theme highlight). Changed .scene_shop_button background-color from var(--btn-2) to var(--accent) so button now matches equipped theme's accent color (e.g., #ff6f91 sky, #f4a261 jungle, #fffd82 galaxy). Verified white text contrast remains readable across all 10 themes.

3. H3: Playwright screenshot test (theme_screenshot_matrix.mjs) was unreliably capturing wrong-state feedback. Root cause: test clicked first button (12.5% chance correct, auto-advancing before wrong-state rendered). Fix: added logic to find correct answer index, click a different button, detect wrong-state markers (.feedback-wrong or .teaching-panel), retry with different buttons if needed. Added --test-only data attributes support. Also added PORT env var override (defaults to 8767, supports PORT=8771 for agent testing). Now captures wrong-state consistently across all 10 themes.

4. M2: Slot 8 (#6c6c00 yellow-green) had low contrast on dark themes (galaxy, arcade_neon, lava, space). Added --slot-border theme token defaulting to transparent, set to rgba(255, 255, 255, 0.3-0.4) on dark themes, applied via `border: 1px solid var(--slot-border)` to .choice-button. Slot 8 now has visible white edge on dark backgrounds without modifying audited color values.

All changes verified: `npx tsc --noEmit` clean, `bash build_github_pages.sh` pass, `pytest tests/ -q` 285 pass, Playwright matrix test completes all 32 screenshots with reliable wrong-state capture.

(Layout architecture fixes L5 agent) Fixed four critical layout blockers affecting mobile (375px) and 8-choice modes:

1. B1+B2: Teaching panel overlay on buttons (FIXED via Option A - architectural redesign). Removed `position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%)` from `.teaching-panel` and changed to document-flow layout: removed `pointer-events: none`, added `margin-top: 16px`, adjusted animation transform from `translateX(-50%) scale(0.7)` to just `scale(0.7)`. Panel now renders AFTER choice buttons in DOM order and scrolls naturally with content, eliminating all overlap. Verified: sky/arcade_neon/galaxy at 375px 8-choice show all 8 buttons + panel below without overlap. Screenshot: sky-wrong-8-mobile.png shows buttons 1-8 visible, teaching panel below "Tap to continue".

2. B3: Question card pushed off top in jungle 8-choice 375px. Changed `.question-card` from `position: relative` to `position: sticky; top: 0; z-index: 5`, keeping the question card pinned at viewport top while content scrolls. Verified: sky-wrong-8-desktop.png shows question card "WHAT DOES THIS STEM MEAN?" fully visible at top with all 8 buttons below.

3. B4: COINS stat pill clipping "999999". Applied `width: max-content` to `.stat-value` selector (used for Best Score, Best Streak, COINS, Daily Goals values). Content-driven sizing allows large numbers like 999999 to display without truncation. (Note: `.streak-counter` and `.score-display` already had `width: auto` from prior L2 fix.)

4. M1: Mastery sticky header (.mastery-header, `position: sticky; top: 0`) was covering the "Lesson 1" / "Lesson 2" h3 headings on initial scroll. Added `scroll-margin-top: 100px` to `.scene_mastery_lesson h3` selector to reserve space when scrolling to headings. Verified: sky-mastery-desktop.png shows "Lesson 2" and "Lesson 3" headings fully visible below the header.

All fixes are architectural (no z-index band-aids, no fallback defaults). Verified: `npx tsc --noEmit` clean, `bash build_github_pages.sh` pass, Playwright load + quiz smoke tests pass, `pytest tests/ -q` 285 pass. Theme matrix screenshots generated and manually verified for all four blockers.

(Layout + z-index fixes L2) Fixed play-screen layout blockers from theme chaos report:
1. Top-bar reflow: changed .play-top-bar from `display: grid; grid-template-columns: 1fr 1fr` to `display: flex; flex-wrap: wrap; justify-content: center` so streak/score pills wrap naturally on narrow viewports instead of forcing 2 equal columns that cause overlap @ 375px. Pills now use `width: auto; white-space: nowrap` for content-driven sizing.
2. Teaching panel z-order: lowered .teaching-panel from `z-index: 150` to `z-index: 50` and raised choice buttons to `z-index: 10` so buttons remain visible + clickable above panel during wrong-answer feedback. Panel bottom repositioned from `90px` to `80px` to clear button grid.
3. Choice button sizing on 375px: added `@media (max-width: 375px)` rule for 6/8-choice buttons to shrink from 72px min-height to 56px, font from 16px to 13px, padding from 16px to 10px, ensuring 8 buttons fit screen height (2x4 grid @ 56px + gaps = under 400px visible).
4. Tap-to-continue hint visibility: raised .continue-hint `z-index` from 200 to 250 and lowered `bottom` from 40px to 24px to keep hint clearly visible above all overlays including teaching panel.
5. Progress dots and session counter: changed from `grid-column: 1 / -1; order: X` (grid-only properties) to `flex-basis: 100%` for flex layout compatibility.
Removed unused import `MOCK_BUNDLE` from data_loader.ts to unblock TypeScript build.
Verified: `npx tsc --noEmit` clean, `bash build_github_pages.sh` success, Playwright load + quiz smoke tests pass.

(Theme contrast overhaul) Fixed underwater + dark-theme text visibility by replacing hardcoded colors with theme tokens across top-bar, stat pills, feedback overlays, and shop UI. Changes include: (1) Direction chip background changed from hardcoded white (#ffffff) to var(--card) so it adapts to each theme's card color. (2) Feedback icons (.feedback-icon-correct, .feedback-icon-wrong) background changed from #ffffff to var(--card) and text color from #1c2a3a to var(--text) for proper contrast on dark themes like underwater, space, and galaxy. (3) Choices chip (.choices-chip, used in home mode selection) changed from #ffffff to var(--card) for consistency. (4) Equipped badge (.shop-tile.equipped and ::after) changed from hardcoded #ffd700 (gold) to var(--accent) and text color to var(--text), so the equipped visual matches the theme's accent color (e.g., yellow-gold for underwater, not generic gold). (5) Revealed-correct overlay (.feedback-correct-revealed) now includes `outline: 3px solid var(--card) !important; outline-offset: -1px;` to create a visible edge between the button and overlay, preventing blend-in on same-hue themes like slime_world. All changes use CSS theme tokens, ensuring WCAG 5.5:1 target is maintained per COLOR_CONTRAST_ACCESSIBILITY.md.

(Fix 1) Teaching panel repositioned: moved .teaching-panel from `bottom: 160px` to `bottom: 90px` to clear the choices grid during wrong-answer feedback. Teaching panel now sits comfortably between the choice buttons and the "Tap to continue" hint, with dimmed non-feedback buttons preventing visual overlap. Verified at 1280x800 that panel no longer obscures any choice button.

(Fix 4) Mobile 375px viewport optimization: added dedicated media query for screens 375px and narrower. Streak counter shrinks to 16px font / 6px padding; score display shrinks to 11px font / 6px padding; progress dots max-width tightens to 150px with 3px gap. Session counter remains hidden (existing rule). Home pill, lesson cards, and mode cards scale responsive fonts. Verified at 375x800 headless screenshot that top bar uses compact 2-column layout without overlaps.

(Fix 5) Mastery header sticky and properly styled: .mastery-header now uses `position: sticky; top: 0; z-index: 40;` matching the Shop/Goals pattern. Header spans full width with flexbox, includes gradient background, padding, rounded border, and shadow. Back button (.btn-back) sits at the right end of the header flex container; "X / 140 mastered" subtitle (.mastery-subtitle) is a flex:1 left-aligned element between title and button. Title h1 is flex:1 and 32px font-weight:700. Verified at 1280x800 that header is fully readable at top edge with no clipping.

(Fix 6) No double purchase_theme call detected: audit confirms purchase_theme(theme.id) is called exactly once per Buy button click in scene_shop.ts line 124. Init.ts render_shop callback on_purchase_attempt is a no-op hook (intentional for future state updates); the purchase already happened in scene_shop. Persistence write occurs once per purchase; no redundant writes observed.

### Additions and New Features

Docset refresh (docset-updater skill): added `docs/INSTALL.md`, `docs/USAGE.md`, `docs/CODE_ARCHITECTURE.md`, and `docs/FILE_STRUCTURE.md` stubs grounded in repo evidence (build scripts, `tools/`, `src/`, `data/`). Centrally maintained docs (AUTHORS, MARKDOWN_STYLE, PYTHON_STYLE, REPO_STYLE) verified present and not edited. No banned docs (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, templates) present. Required root docs (AGENTS.md, README.md, dual LICENSE files) present.

Visible Home button on quiz screen: added touch-friendly "Home" button (min 44x44 px) in top-right corner (.play-corner-nav, .btn-home-quit). Button is outlined style with accent border, subtly positioned, no confirm dialog on click (drops round state). Keyboard Escape binding (bind_play_keys on_home) now has corresponding UI affordance so kids know how to return to home mid-round. Button text is ASCII-only; hover flips background to accent color with white text.

Path B refinement: permanent 8-slot identity via button fill colors (removed theme-dependent btn-1..4 cycling). Implemented warm/cool color alternation (red, green, blue, magenta, orange, teal, purple, yellow-green) for perceptual slot separation across all 8 buttons. Added juicy gloss overlay and inset highlight + shadow for 3D toy-press tactile depth. On :active, buttons translateY down with reduced shadow for press feedback. Redesigned keyboard badge: white background (90% opacity) with dark text, neutral styling independent of button fill. Removed dim-sibling fog during feedback-buttons stay vivid. All 8 fills audited at 5.5:1 contrast vs white text per docs/COLOR_CONTRAST_ACCESSIBILITY.md.

Results screen medal glyphs: added `.results-medal` div above trophy tier label, displaying Unicode escapes by tier (Gold: \u{1F947}, Silver: \u{1F948}, Bronze: \u{1F949}, Flawless: \u{1F3C6}). Uses textContent for ASCII-safe rendering. Home button already present in results-button-group next to Play Again + Shop.

Mastery header and back button: consolidated `.mastery-header` at top of screen; includes large "Mastery" title + "X / 140 mastered" subtitle + visible `.btn-back` button top-right with on_back callback. Removed separate `.scene_mastery_overall` counter below header (now part of header).

Shop equipped tile styling: shop tiles now have `.equipped` class added to card root when equipped. CSS selectors `.shop-tile.equipped` can render gold border + glow + checkmark glyph (escapes: &check;).

### Fixes and Maintenance

**Audit bug fixes (8 bugs from code-review findings):**

1. **Bug 1 (HIGH FUNCTIONAL): Anti-grind cap semantics corrected** - Changed DAILY_GOAL_REWARD_CAP from coin total to award COUNT. Renamed field goal_rewards_granted -> goal_rewards_count_today in StatsToday; updated cap logic to increment by 1 award (not coin amount). Cap now correctly limits 15 awards/day (not 15 coins). Updated grant_goal_rewards() and check_and_grant_completion_bonuses() to respect the new cap with re-checked bounds after each award.

2. **Bug 2 (HIGH DEAD CODE): Removed duplicate completion_bonuses_awarded_today field** - Top-level SaveSchemaV1 field was unused dead code (only nested field in DailyGoalsToday was read/written). Removed the orphaned optional field.

3. **Bug 3 (HIGH UI BUG): Mastery screen streak display now live** - Removed placeholder "Streak: 5" / "Best: 12" hardcoded strings and wired to actual save.best_streak value. Scene now displays "Best: X" using live saved data.

4. **Bug 4 (BLOCKER): Moved bandit security test to E2E suite** - Bandit test was in tests/ (collected by pytest) but should have been in tests/e2e/. Used `git mv` to move tests/test_bandit_security.py -> tests/e2e/e2e_bandit_security.py, added shebang, made executable, added if __name__ == "__main__" guard per test_shebangs.py.

5. **Bug 5 (CRITICAL TypeScript): Removed `as any` casts from share/clipboard** - Replaced `(navigator as any).share` and `(navigator as any).clipboard` with proper typed feature checks: `typeof navigator.share === "function"` and `navigator.clipboard` type guard. No unnecessary casts.

6. **Bug 6 (HIGH Logic + Cap bugs):** (a) Clarified goal completion semantics: progress.completed=true means "newly completed by player"; grant function checks && pays, then marks completed=false (paid out). Updated comment for clarity. (b) Fixed remaining_cap snapshot bug: loop now re-checks remaining_cap after each award via `remaining_cap -= 1` per grant.

7. **Bug 7 (HIGH Integration): Wired completion bonuses to round-end flow** - check_and_grant_completion_bonuses() was exported but never called. Added import to init.ts and call immediately after grant_goal_rewards() in handle_choice(). Bonuses now fire when 3 or 5 daily goals completed in a session.

8. **Bug 8 (MEDIUM Dead CSS): Removed orphaned CSS rules** - Deleted unused .mastery-header + .mastery-header h1 rules (~25 lines, obsoleted by L8 rewrite using .mastery-header-banner). Deleted .btn-home-results + sub-rules (~33 lines, obsoleted by scene_results.ts migration to btn-secondary class). No functional impact; cleanup only.

Verified: `npx tsc --noEmit` clean, `bash build_github_pages.sh` pass (48.8kb main.js), `pytest tests/ -q` 289 pass (down from 290: bandit moved out of pytest collection as intended). Playwright smoke tests pass. Screenshot evidence: mastery-best-streak-42-sky.png shows header "Best: 42" live from save data. Migration in persist.ts handles old saves gracefully (resets goal_rewards_count_today to 0 if legacy field present).

Code hygiene: removed dead code and XSS-shaped patterns. Replaced `innerHTML` assignment in mascot.ts with DOMParser for safer SVG injection. Removed try/catch from data_loader.ts to let fetch failures throw loudly per repo style (design philosophy: fix the design, not the symptom). Deleted unused fields: `muted` (sfx toggle never wired), `correct_in_a_row_max` (never read), and `ScreenKind` type alias (superseded by scene_* pattern). Removed dead `on_next` callback from PlayKeyHandlers (Enter/Space no-op during quiz; advancement driven by feedback state machine). Moved bandit security scan from pytest (tests/test_bandit_security.py) to E2E suite (tests/e2e/e2e_bandit_security.py) per E2E_TESTS.md conventions; bandit is a slow external tool not suitable for fast pytest lane.

TTY guard in run_web_server.sh: added `[ -t 0 ]` check before `open` command so browser doesn't pop when agents invoke the script non-interactively. Fixes agent workflow blocking on unsolicited browser launches.

### Behavior or Interface Changes

M2 Phase 1 complete: TypeScript game source (src/ + src/types/), build pipeline (build_github_pages.sh, run_web_server.sh, export_single_file.sh, tools/yaml_to_json.py), Playwright smoke harness, GitHub Pages workflow, direction chip + colored card stripes for stem/meaning pairs, theme catalog with 3 rarity tiers (Base, Rare, Epic), coins/shop/daily-goals/mastery scaffolding, ScreenState machine, daily goal progress tracking + rewards capping, streak bonuses with cycling milestones, and input key binding for fast navigation.

Per-mode distractor count selector: each game mode card (Quick Run / Challenge / Endless) displays a 3-chip row (4 / 6 / 8 choices) inside the card. Tap chip to change count; selection persists per mode in save schema. Cards now render 2x2 (4 choices), 2x3 (6 choices), or 2x4 (8 choices) grids on wider screens. Keyboard input extended to 1-8 keys for choice selection.

Answer feedback redesign: CHOSEN CORRECT is now white + gold outline with checkmark; CHOSEN WRONG is black + hot pink outline with X glyph. REVEALED CORRECT (correct answer shown after wrong pick) also uses white + gold. Sibling buttons dim during feedback so the chosen/revealed buttons stand out unmistakably.

Replaced home-screen endless-mode checkbox with three game-mode cards (Quick Run 10 questions, Challenge 25 questions, Endless unlimited): cards have distinct per-mode accent colors, large title + tagline, drop shadow, hover scale effect, keyboard shortcuts 1/2/3 for selection. Mode selection is no longer persisted globally; last-selected mode is tracked per session to focus the card on return (last_mode_id in save schema, replacing endless_mode).

Wrong-answer flow now prevents auto-advance: FEEDBACK_WRONG_MS (600ms) gates a minimum wait for shake + glow-in animations; after minimum wait, a pulsing "Tap to continue" hint appears at bottom-center. Student advances only on explicit click, Enter, or Space keypress, allowing self-paced reading of the teaching panel before moving to the next question. Correct answers continue to auto-advance after 800ms (unchanged).

RoundConfig now includes choices_per_question field (defaults to 4). Save schema adds last_choices_by_mode field (Record<mode_id, count>) to persist per-mode choice count. Question builder scales confusability sampling cap from hard-coded top-6 to max(6, (count-1)*2) to support up to 8 choices with adequate candidate pool.

Button feedback per "Refined Path B" architecture: three separate visual channels prevent identity-correctness confusion. (1) PERMANENT slot identity: thick left stripe (8 fixed colors per slot 1-8) + circular keyboard badge with slot number (top-left corner)-both locked across all themes. (2) THEME fill: buttons keep btn-${i%4+1} backgrounds (cycling per theme). (3) TRANSIENT correctness state: feedback is now overlay-only. Correct shows gold border glow + checkmark badge (scale-in animation); wrong shows pink border glow + X badge + shake + brief desaturation. Button fill color NEVER swaps during feedback, eliminating the prior two-greens ambiguity.

### Fixes and Maintenance

Implemented subject-stem deck shuffle to eliminate stem repeats within cycles. SubjectDeck class uses Fisher-Yates shuffle per question cycle; prevents seam collisions (last K stems of previous cycle reappearing in first K of next) via bounded reshuffle retries (K = min(4, floor((pool.length - 1) / 2))).  Retry-queue resurface removes the resurfaced stem from the deck to prevent immediate re-draw. Verified: no repeats within a cycle, seam collisions minimized across 50-pick test runs from 7-stem pool.

Audit pass: removed dead exports (session_start_ms, reset_save_for_tests), eliminated any-cast in show_stem_details, wired record_master_stem() and record_play_seconds(15s) into daily goal tracking, implemented streak_banner_for() with deterministic cycling, replaced innerHTML with createElement for stat-items in scene_home, replaced optional-chain + || 0 defensive patterns in daily_goals with assertion guards, updated shell scripts to use set -euo pipefail, removed unused from-import in extract_stems.py.

Fixed H3 (session counter hardcoded): Session counter in play top-bar now wired to real daily goals counter. Added get_today_answered_count() export in daily_goals.ts; ui_rendering now calls it at render time to display actual answered count instead of hardcoded 0.

Fixed M1 (teaching panel innerHTML): Refactored build_teaching_panel in feedback.ts to return structured TeachingPanelData object instead of HTML string. ui_rendering now constructs teaching panel DOM using createElement + textContent for all content paths (no innerHTML). DOM structure: two .teaching-row divs each with label span + stem span (teaching-stem class) + " = " + meaning span (teaching-meaning class).

Fixed M4 (dead feedback-active class): Removed add/remove of non-existent .feedback-active CSS class on choices-grid. This class has no rule in style.css and was unused dead code on both add and remove paths in flash_answer_feedback.

Verified H2 confirm: continue-hint DOM element is created and appended AFTER teaching-panel in flash_answer_feedback wrong-answer path, ensuring correct stacking order and z-index layering so hint displays above all other feedback elements.

Code cleanup audit (H4-M10 fixes): (H4) removed CHOICES_OPTIONS duplication in scene_home.ts, now imports from constants. (H5) deleted orphaned ROUND_QUESTION_COUNT export. (H6) wired DEFAULT_CHOICES_PER_QUESTION constant to all call sites (scene_home.ts, init.ts) to eliminate hide-bug ?? 4 pattern. (H7) deleted no-op SubjectDeck.record_drawn() method and its unused call. (L1) asserted non-null on RetryQueue Map.get with invariant comment instead of ?? 0. (L3) removed dead _retry: undefined parameter from next_question signature. (L4) deleted dead migration shim in persist.ts (last_choices_by_mode for v1 schema). (L8) added sentinel comment on endless mode question_count. (M2) threaded retry_queue and subject_deck through RoundState instead of module-level globals, eliminating mutable state leak. (M3) wired play_seconds_interval teardown: clears on screen exit, restarts on question entry for proper lifecycle. (M5) removed bonus_banner from apply_correct return type (streak banner re-derived via streak_banner_for). (M10) swapped slot 7 from purple (#a719db) to sky blue (#076dad) for better color separation; updated warm/cool comment to reflect actual 4-warm + 4-cool grouping.

CSS audit fixes (Bundle A): (B1) Verified theme blocks in style.css contain only color variables (--bg-a, --bg-b, --accent, --text, --text-soft, --card, --btn-1..4); no layout rules (display, grid-template-columns, flex-direction, width, height) override theme selectors. Layout remains stable across all themes. Tested: 8-choice grid holds 2x4 layout on default sky theme and jungle forest theme (verified via screenshot). (H1) Repositioned .teaching-panel from center (top: 50%) to bottom-aligned (bottom: 160px) to place it below the choices grid in the mascot-slot area; eliminated overlap with revealed-correct button. Updated panel-bounce-in keyframe transform to match. (H2) Enhanced .continue-hint visibility: increased z-index to 200 (above teaching-panel), added box-shadow for depth, forced opacity: 1. (M11) Grew .choice-button min-height from 80px to 84px; adjusted 6/8-choice variants to 72px for better touch targets. Mascot slot remains 120x120 without expansion. (L11) Bumped .stat-label font-size from 12px to 16px (33% increase) on home screen stat cards. (L13) Added :focus-visible outlines (3px solid accent) to all interactive buttons: .choice-button, .mode-card, .btn-home-quit, .btn-primary, .btn-secondary, .btn-home-results, .btn-back, .scene_shop_button, .scene_shop_header button, .scene_goals_header button, .scene_mastery_header button, .lesson-card, .choices-chip, .scene_mastery_tile. (L14) Refactored .direction-chip from monochrome orange/purple fills to white background with contrasting borders and colored text: stem_to_meaning uses #ff7a45 border + text on white; meaning_to_stem uses #6c63ff border + text on white. Chip arrow remains semi-opaque. (M13) Pre-created .results-medal (font-size: 96px, block layout, auto margins) and .btn-home-results (outline secondary style, 100% width, full touch-target height) for Bundle D medal glyph display. (M14) Pre-created .mastery-header (font-size: 32px, font-weight: 900) and .btn-back (secondary outline, hover color on accent) for Bundle D mastery nav. (L12) Pre-created .shop-tile.equipped (gold border + 20px gold glow, ::after pseudo checkmark glyph) for Bundle D equipment status.

Fixed docs/COLOR_CONTRAST_ACCESSIBILITY.md truncation (B2): Completed sentence at line 118 left hanging mid-phrase "Updating the existing color palette in". Clarified that updating the 8-color slot palette in src/slot_palette.ts requires re-auditing all affected YAML files. Added cross-repo reference note: contrast_calculator.py lives in sibling <biology-problems> repo; in-repo color work uses src/slot_palette.ts for 8 audited slot fills.

Fixed ui_rendering.ts teaching panel type error: build_teaching_panel returns TeachingPanelData | null instead of HTML string. Refactored ui_rendering to build DOM from structured data via createElement + appendChild. Panel now renders two .teaching-row divs: row 1 "You picked: [stem] = [meaning]" and row 2 "Correct: [stem] = [meaning]". Eliminates innerHTML usage. TypeScript now compiles without errors.

Created docs/GAME_USAGE.md: comprehensive game guide covering three modes (Quick Run 10 questions/Challenge 25 questions/Endless unlimited), per-mode distractor chip counts (4/6/8 persistent per mode), keyboard controls (1-8 for answer slots, Enter/Space to continue, Esc/Home to quit), home screen navigation (lesson selection grid, Select All/Clear buttons, Shop/Goals/Mastery tabs), theme unlock system (Base/Rare/Epic rarity tiers with coin costs), button visual design (permanent 8-color slot identity stripes + theme-dependent fills + transient feedback overlays), wrong-answer self-paced flow with "Tap to continue" hint, and save data location (localStorage key stems_quiz_v1).

Updated README.md: added "How to play" section describing 3-mode card system, per-card distractor chip count selection (4/6/8), permanent 8-slot button identity with theme-dependent fills, wrong-answer self-paced flow requiring explicit action to continue, correct-answer auto-advance after 800ms, and Home button affordance. Added link to docs/GAME_USAGE.md in documentation section with file-path link text matching URL.

Updated Playwright smoke test (tests/playwright/test_quiz_smoke.mjs) to use locator-based waits instead of fixed waitForTimeout delays: After clicking Quick Run mode card, wait for .choices-grid selector (5s timeout) instead of hardcoded 500ms. After pressing "1" key, check for .continue-hint visibility (3s timeout) to detect wrong answer; if visible, press Enter then wait for .question-text (3s timeout); if not visible (correct answer), wait directly for .question-text auto-advance. Eliminates race conditions and flaky sleeps.

### Removals and Deprecations

Removed answer_feedback ScreenState variant (feedback rendered inline); removed tools/build.mjs from tracked files (phantom entry).
