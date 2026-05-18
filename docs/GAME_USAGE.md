# Game usage

Comprehensive guide to playing the stem-lesson-quiz-game.

## Game modes

The home screen presents three game-mode cards. Tap a card to start, or use keyboard shortcuts 1/2/3 to select.

| Mode | Questions | Default choices | Purpose |
| --- | --- | --- | --- |
| Quick Run | 10 | 4 | Fast session; learn or review |
| Challenge | 25 | 6 | Longer session; build muscle memory |
| Endless | unlimited | 8 | Marathon mode; high-difficulty streak play |

## Distractor chips

Each game-mode card displays a 3-chip row (4 / 6 / 8 choices). Tap a chip to change the distractor count for that mode; your selection persists in the save file (localStorage key `stems_quiz_v1`).

Question builder scales confusability scoring to ensure adequate distractor pool:
- 4 choices: top 3 most confusable distractors
- 6 choices: top 5 most confusable distractors
- 8 choices: top 7 most confusable distractors

## Game screens and flow

### Quiz screen

- **Top-left**: Home button (touch-friendly, 44x44 px minimum) with "Home" label and keyboard badge.
- **Top-right**: current lesson name and question count (e.g., "Lesson 1" / "Q 3 / 10").
- **Center**: stem card (red stripe, italic stem + definition).
- **Below stem**: four or more answer buttons (permanent 8-color slot identity + theme-dependent fill).
- **Below buttons**: teaching panel (meaning + example sentence, pulsing on load).

### Answer button design

Answer buttons feature three independent visual channels to prevent identity-correctness confusion:

1. **Permanent slot identity** (left thick stripe + keyboard badge with slot number in top-left corner): locked across all themes.
2. **Theme fill** (button background): cycles per theme (btn-1..4 background cycling).
3. **Transient correctness state** (overlay): feedback appears on top without changing button color.

Feedback states:
- **Correct**: white background + gold border glow + checkmark badge (scale-in animation).
- **Wrong**: black background + hot pink border glow + X badge + shake animation + brief desaturation.
- **Revealed correct** (after wrong pick): white background + gold border glow + checkmark badge.

Sibling buttons dim (reduced opacity) during feedback so the chosen/revealed buttons stand out clearly.

### Wrong-answer flow

After pressing a wrong answer:

1. Minimum 600ms wait for shake + glow-in animations.
2. Pulsing "Tap to continue" hint appears at bottom-center.
3. Student advances only on explicit action: click/tap, Enter key, or Space key.
4. Allows self-paced reading of the teaching panel before moving to next question.

Correct answers auto-advance after 800ms (no explicit action required).

### End of round

After the final question, the round ends and transitions back to the home screen. Daily goals and mastery progress are updated.

## Keyboard controls

| Key | Action |
| --- | --- |
| 1-8 | Select answer slot 1-8 (during quiz) |
| Enter | Confirm answer or continue from wrong-answer hint |
| Space | Confirm answer or continue from wrong-answer hint |
| Esc | Return to home screen (quit round) |
| Home | Return to home screen (quit round) |

## Home screen navigation

The home screen includes multiple sections (all accessible via clicking or keyboard):

- **Game mode cards** (top): Quick Run / Challenge / Endless. Keyboard shortcuts 1/2/3 select modes.
- **Lesson selection grid** (middle): all 20 lessons. Tap a lesson to load stems from that lesson for the selected mode. Keyboard: arrow keys to navigate, Enter to select.
- **Select All / Clear buttons** (above lesson grid): mass-select or clear all lessons.
- **Navigation tabs** (bottom): Shop / Goals / Mastery. Keyboard: left/right arrow keys or Tab to move between tabs.

### Shop

Browse and unlock themes. The shop holds 15 themes grouped into four sections:

- **Starter Themes**: sky, jungle, slime_world, candy_kingdom.
- **World Themes**: underwater, arcade_neon, ancient_ruins, lava.
- **Mascot Themes**: huskies, wildcats, bison, knights, marauders (feeder-school motifs).
- **Ultimate Themes**: space, galaxy.

Each card renders a per-theme CSS motif at rest (no hover required) so cards are distinguishable on touch. Tap a card to preview the theme immediately; use the Buy/Equip button to unlock or activate. Equipped cards show a thick border, glow, and "EQUIPPED" ribbon. Prices display as "Coins: NNNN". Theme catalog authoritative source: `src/cosmetics.ts`.

### Daily goals

Track daily progress and earn streak + completion bonuses:

- **5 goals per day** drawn from a 15-entry pool via stratified sampling (2 easy + 2 medium + 1 hard).
- Easy goals are first-session reachable (e.g. "Answer 10 questions today", "Visit the shop").
- Medium and hard goals stretch play sessions (e.g. "5 in a row", "Master a new stem", "80% accuracy").
- **Completion bonuses**: +50 coins for 3 goals completed, additional +150 coins for all 5.
- Anti-grind cap: 15 coins/day from individual goal rewards (bonuses are on top of the cap).

Goals reset at local midnight. Streak milestones cycle deterministically; extend your streak by completing all 5 goals on consecutive days. Goal pool authoritative source: `src/daily_goals.ts` (GOAL_POOL).

### Mastery

Wordle-inspired trophy view of all 20 lessons at a glance:

- Desktop renders a 2-column grid (10 lessons per column); mobile collapses to 1 column.
- Each lesson card shows "Lesson N" + "M/7" progress + a row of 7 small colored tiles.
- Tile colors are fixed across all themes: green = mastered, yellow = learning, red = weak, gray = untried.
- Sticky header shows "X / 140 mastered" total plus Streak, Best, Theme chips and Share/Back buttons.
- Stems with high mastery are de-prioritized in future rounds (sampling bias toward lower-mastery stems).

## Themes and customization

Themes are applied via a `body[data-theme="X"]` attribute swap. Each theme defines CSS variables in `src/style.css`:

- `--primary-bg`: main background color.
- `--primary-text`: main text color.
- `--button-fill-1..4`: cycling button fill colors per theme.
- Accent colors, borders, and shadows.

Switching themes applies immediately; theme choice is saved to `stems_quiz_v1` localStorage key.

## Save data

Game state is saved to browser localStorage under the key `stems_quiz_v1`. Saved state includes:

- **Last selected mode**: focus the card on return.
- **Last choices by mode**: per-mode distractor counts (4/6/8).
- **Daily goals**: progress and streak milestones.
- **Mastery data**: per-stem correct counts.
- **Theme selection**: active theme name.
- **Coins and shop progress**: theme unlock states.

Clearing browser cache will erase all save data. No cloud sync or account login required.

## Accessibility

- Minimum touch target: 44x44 pixels (buttons, cards, chips).
- Keyboard navigation: all controls accessible via Tab, arrow keys, Enter, Space, and number keys.
- Color contrast: all text and button fills audited at 5.5:1 contrast ratio against white background (WCAG AA+).
- Home button always visible for exit affordance.

