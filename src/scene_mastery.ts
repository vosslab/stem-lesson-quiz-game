// Mastery scene: trophy screen showing progress.
// Compact 2-column grid of lesson cards (desktop), 1-column (mobile).
// Each card: "Lesson N    M/7" + 7 small colored tiles (22px).
// Header: title + big mastered count + streak + equipped theme.
// Footer: inspirational goal message.
// Tap tile for stem detail modal.
// Share button builds emoji text + copies to clipboard.

import type { Bundle, Stem } from "./types/stem";
import { load_save, reset_save } from "./persist";
import * as mastery from "./mastery";

//============================================

interface MasteryOpts {
  bundle: Bundle;
  on_back: () => void;
}

//============================================

export function render_mastery_screen(opts: MasteryOpts): HTMLElement {
  const container = document.createElement("div");
  container.classList.add("scene_mastery");

  // Top banner header: title, mastered count, streak, theme
  const header_banner = document.createElement("div");
  header_banner.classList.add("mastery-header-banner");

  const header_left = document.createElement("div");
  header_left.classList.add("mastery-header-left");

  const title = document.createElement("h1");
  title.classList.add("mastery-title");
  title.textContent = "Stem Mastery";
  header_left.appendChild(title);

  const summary = mastery.mastery_summary(opts.bundle);
  const mastered_count = document.createElement("div");
  mastered_count.classList.add("mastery-count");
  mastered_count.textContent = `${summary.mastered} / ${summary.total}`;
  header_left.appendChild(mastered_count);

  header_banner.appendChild(header_left);

  const header_right = document.createElement("div");
  header_right.classList.add("mastery-header-right");

  // Best streak and equipped theme from save data
  const save = load_save();
  const best_chip = document.createElement("div");
  best_chip.classList.add("mastery-chip");
  best_chip.textContent = `Best: ${save.best_streak}`;
  header_right.appendChild(best_chip);

  const theme_chip = document.createElement("div");
  theme_chip.classList.add("mastery-chip");
  theme_chip.textContent = `Theme: ${format_theme_name(save.equipped_theme)}`;
  header_right.appendChild(theme_chip);

  header_banner.appendChild(header_right);

  // Control buttons at top-right
  const header_buttons = document.createElement("div");
  header_buttons.classList.add("mastery-header-buttons");

  const share_button = document.createElement("button");
  share_button.className = "mastery-share-button";
  share_button.textContent = "Share";
  share_button.addEventListener("click", () => {
    handle_share(opts.bundle);
  });
  header_buttons.appendChild(share_button);

  const back_button = document.createElement("button");
  back_button.className = "btn-back";
  back_button.textContent = "Back";
  back_button.addEventListener("click", opts.on_back);
  header_buttons.appendChild(back_button);

  header_banner.appendChild(header_buttons);

  container.appendChild(header_banner);

  // Legend (color key)
  const legend_section = document.createElement("div");
  legend_section.classList.add("mastery-legend");

  const legend_items = [
    { label: "Mastered", color: "#06d6a0" },
    { label: "Learning", color: "#ffd166" },
    { label: "Weak", color: "#ff6b6b" },
    { label: "Untried", color: "#cccccc" },
  ];

  for (const item of legend_items) {
    const item_div = document.createElement("div");
    item_div.classList.add("mastery-legend-item");

    const color_dot = document.createElement("div");
    color_dot.classList.add("mastery-legend-dot");
    color_dot.style.backgroundColor = item.color;
    item_div.appendChild(color_dot);

    const label_span = document.createElement("span");
    label_span.classList.add("mastery-legend-label");
    label_span.textContent = item.label;
    item_div.appendChild(label_span);

    legend_section.appendChild(item_div);
  }

  container.appendChild(legend_section);

  // 2-column grid of lesson cards (desktop), 1-column (mobile)
  const cards_grid = document.createElement("div");
  cards_grid.classList.add("mastery-cards-grid");

  for (const lesson of opts.bundle.lessons) {
    const card = document.createElement("div");
    card.classList.add("mastery-card");

    // Card header: Lesson number + progress
    const card_header = document.createElement("div");
    card_header.classList.add("mastery-card-header");

    const lesson_title = document.createElement("div");
    lesson_title.classList.add("mastery-card-title");
    lesson_title.textContent = `Lesson ${lesson.number}`;
    card_header.appendChild(lesson_title);

    const lesson_stat = mastery.lesson_mastery(opts.bundle, lesson.number);
    const progress_text = document.createElement("div");
    progress_text.classList.add("mastery-card-progress");
    progress_text.textContent = `${lesson_stat.mastered}/7`;
    card_header.appendChild(progress_text);

    card.appendChild(card_header);

    // Tiles row (7 tiles)
    const tiles_row = document.createElement("div");
    tiles_row.classList.add("mastery-tiles-row");

    for (const stem of lesson.stems) {
      const tile_wrap = document.createElement("div");
      tile_wrap.classList.add("mastery-tile-wrap");

      const tile = document.createElement("button");
      tile.classList.add("mastery-tile");

      const cls = mastery.classify_stem(stem);
      tile.classList.add(`mastery-tile-${cls}`);
      tile.setAttribute("data-stem-id", stem.id);

      tile.addEventListener("click", () => {
        show_stem_details(stem);
      });

      tile_wrap.appendChild(tile);
      tiles_row.appendChild(tile_wrap);
    }

    card.appendChild(tiles_row);
    cards_grid.appendChild(card);
  }

  container.appendChild(cards_grid);

  // Footer with inspirational goal message
  const footer = document.createElement("div");
  footer.classList.add("mastery-footer");

  const goal_message = compute_goal_message(summary.mastered);
  const goal_text = document.createElement("div");
  goal_text.classList.add("mastery-goal-text");
  goal_text.textContent = goal_message;
  footer.appendChild(goal_text);

  container.appendChild(footer);

  // Tucked-away "Reset save" escape hatch. Placed at the bottom of the
  // mastery page (not home) so an accidental tap is unlikely. Used to
  // recover kids stuck on a deploy with a broken localStorage blob.
  const reset_row = document.createElement("div");
  reset_row.classList.add("mastery-reset-row");

  const reset_btn = document.createElement("button");
  reset_btn.classList.add("mastery-reset-button");
  reset_btn.textContent = "Reset save";
  reset_btn.addEventListener("click", () => {
    const ok = window.confirm(
      "Reset save? This wipes coins, themes, mastery, and daily goals. This cannot be undone.",
    );
    if (!ok) {
      return;
    }
    const really = window.confirm("Are you really sure? Last chance.");
    if (!really) {
      return;
    }
    reset_save();
    window.location.reload();
  });
  reset_row.appendChild(reset_btn);
  container.appendChild(reset_row);

  return container;
}

//============================================

function format_theme_name(theme: string): string {
  return theme
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

//============================================

function compute_goal_message(mastered: number): string {
  if (mastered === 0) {
    return "Master your first stem!";
  }

  const milestones = [10, 25, 50, 75, 100, 140];
  for (const m of milestones) {
    if (mastered < m) {
      return `Next goal: ${m} mastered`;
    }
  }

  return "You are a master!";
}

//============================================

function handle_share(bundle: Bundle): void {
  // Build emoji-block share text (user-facing content; emoji codes allowed per spec)
  const summary = mastery.mastery_summary(bundle);

  let text = `Stems Quiz -- ${summary.mastered}/${summary.total} mastered\n`;

  // Emoji codes for share text: green square (mastered), yellow (learning),
  // red square (weak), white square (untried)
  const emoji_mastered = String.fromCodePoint(0x1f7e9);
  const emoji_learning = String.fromCodePoint(0x1f7e8);
  const emoji_weak = String.fromCodePoint(0x1f7e5);
  const emoji_untried = String.fromCodePoint(0x2b1c);

  for (const lesson of bundle.lessons) {
    let line = `L${String(lesson.number).padStart(2, "0")} `;
    for (const stem of lesson.stems) {
      const cls = mastery.classify_stem(stem);
      if (cls === "mastered") {
        line += emoji_mastered;
      } else if (cls === "learning") {
        line += emoji_learning;
      } else if (cls === "weak") {
        line += emoji_weak;
      } else {
        line += emoji_untried;
      }
    }
    text += line + "\n";
  }

  text += "\nplay stems quiz online";

  // Try navigator.share first (mobile native)
  if (typeof navigator.share === "function") {
    void navigator.share({
      title: "Stems Quiz Mastery",
      text: text,
    });
  } else if (navigator.clipboard) {
    // Fallback to clipboard
    void navigator.clipboard.writeText(text).then(() => {
      show_toast("Copied to clipboard!");
    });
  }
}

//============================================

function show_toast(message: string): void {
  const toast = document.createElement("div");
  toast.classList.add("mastery-toast");
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

//============================================

function show_stem_details(stem: Stem): void {
  // Modal with stem details: stem, meaning, example word, definition.
  // Create a semi-transparent overlay and centered card.
  const overlay = document.createElement("div");
  overlay.classList.add("mastery-modal-overlay");

  const modal = document.createElement("div");
  modal.classList.add("mastery-modal");

  const close_btn = document.createElement("button");
  close_btn.classList.add("mastery-modal-close");
  close_btn.textContent = "Close";
  close_btn.addEventListener("click", () => {
    overlay.remove();
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  const title_div = document.createElement("div");
  title_div.classList.add("mastery-modal-title");
  title_div.textContent = stem.stem;
  modal.appendChild(title_div);

  const meaning_div = document.createElement("div");
  meaning_div.classList.add("mastery-modal-field");
  const meaning_label = document.createElement("span");
  meaning_label.classList.add("mastery-modal-label");
  meaning_label.textContent = "Meaning:";
  meaning_div.appendChild(meaning_label);
  const meaning_text = document.createElement("span");
  meaning_text.classList.add("mastery-modal-text");
  meaning_text.textContent = stem.meaning;
  meaning_div.appendChild(meaning_text);
  modal.appendChild(meaning_div);

  const example_div = document.createElement("div");
  example_div.classList.add("mastery-modal-field");
  const example_label = document.createElement("span");
  example_label.classList.add("mastery-modal-label");
  example_label.textContent = "Example:";
  example_div.appendChild(example_label);
  const example_text = document.createElement("span");
  example_text.classList.add("mastery-modal-text");
  example_text.textContent = stem.example_word;
  example_div.appendChild(example_text);
  modal.appendChild(example_div);

  const definition_div = document.createElement("div");
  definition_div.classList.add("mastery-modal-field");
  const definition_label = document.createElement("span");
  definition_label.classList.add("mastery-modal-label");
  definition_label.textContent = "Definition:";
  definition_div.appendChild(definition_label);
  const definition_text = document.createElement("span");
  definition_text.classList.add("mastery-modal-text");
  definition_text.textContent = stem.example_definition;
  definition_div.appendChild(definition_text);
  modal.appendChild(definition_div);

  modal.appendChild(close_btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
