// DOM rendering for the question screen and feedback overlay.

import type { Question, RoundState, AnswerResult } from "./types/question";
import type { Bundle } from "./types/stem";
import { FEEDBACK_CORRECT_MS, FEEDBACK_WRONG_MS, STREAK_BANNER_MS } from "./constants";
import { next_praise, CORRECT_PRAISE, WRONG_PRAISE, build_teaching_panel } from "./feedback";
import { burst_confetti } from "./confetti";
import { mount_mascot, set_mascot_state } from "./mascot";
import { slot_accent_for } from "./slot_palette";

let last_correct_praise: string | null = null;
let last_wrong_praise: string | null = null;

//============================================

// Add an overlay feedback icon (checkmark or X) to a button during feedback display.
// Creates a centered badge circle with glyph inside the button.
function add_feedback_icon_overlay(btn: HTMLButtonElement, type: "correct" | "wrong"): void {
	const overlay = document.createElement("span");
	overlay.className = `feedback-icon feedback-icon-${type}`;

	if (type === "correct") {
		overlay.textContent = "\u2713"; // checkmark
	} else {
		overlay.textContent = "\u2717"; // X
	}

	btn.appendChild(overlay);
}

//============================================

// Build the full question screen DOM.
// on_choice is called with the chosen answer string when a button is clicked or key pressed.
// on_home is called when the user clicks the home/quit button or presses Escape.
export function render_question_screen(opts: {
	question: Question;
	round: RoundState;
	on_choice: (chosen: string) => void;
	on_home: () => void;
}): HTMLElement {
	const { question, round, on_choice, on_home } = opts;

	const container = document.createElement("div");
	container.className = "scene_play";

	// Top bar: streak, score, progress, session counter
	const top_bar = document.createElement("div");
	top_bar.className = "play-top-bar";

	const streak_counter = document.createElement("div");
	streak_counter.className = "streak-counter";
	streak_counter.textContent = `Streak: ${round.current_streak}`;

	const score_display = document.createElement("div");
	score_display.className = "score-display";
	score_display.textContent = `Score: ${round.score}`;

	// Progress indicator: dots for short rounds, plain counter for endless.
	// Cap dots at 20 so a 999-question endless round does not tile the screen.
	const progress_dots = document.createElement("div");
	progress_dots.className = "progress-dots";
	const show_dots = !round.config.endless && round.config.target_question_count <= 20;
	if (show_dots) {
		for (let i = 0; i < round.config.target_question_count; i++) {
			const dot = document.createElement("div");
			dot.className = "progress-dot";
			if (i < round.questions_asked) {
				dot.classList.add("answered");
			}
			progress_dots.appendChild(dot);
		}
	} else {
		progress_dots.classList.add("progress-counter");
		const label = round.config.endless
			? `Q ${round.questions_asked + 1}`
			: `Q ${round.questions_asked + 1} / ${round.config.target_question_count}`;
		progress_dots.textContent = label;
	}

	const session_counter = document.createElement("div");
	session_counter.className = "session-counter";
	session_counter.textContent = `Today: ${0} answered`;

	top_bar.appendChild(streak_counter);
	top_bar.appendChild(score_display);
	top_bar.appendChild(progress_dots);
	top_bar.appendChild(session_counter);

	// Question card. Direction is signaled three ways at once so it reads
	// across the room: (1) colored top stripe, (2) directional chip with
	// arrow, (3) monospace styling on the prompt when it's a stem.
	const question_card = document.createElement("div");
	question_card.className = "question-card";
	question_card.setAttribute("data-direction", question.direction);

	const direction_chip = document.createElement("div");
	direction_chip.className = "direction-chip";
	direction_chip.setAttribute("data-direction", question.direction);
	const chip_from = document.createElement("span");
	chip_from.className = "chip-label chip-from";
	const chip_arrow = document.createElement("span");
	chip_arrow.className = "chip-arrow";
	chip_arrow.textContent = "->";
	const chip_to = document.createElement("span");
	chip_to.className = "chip-label chip-to";
	if (question.direction === "stem_to_meaning") {
		chip_from.textContent = "STEM";
		chip_to.textContent = "MEANING";
	} else {
		chip_from.textContent = "MEANING";
		chip_to.textContent = "STEM";
	}
	direction_chip.appendChild(chip_from);
	direction_chip.appendChild(chip_arrow);
	direction_chip.appendChild(chip_to);

	const direction_label = document.createElement("div");
	direction_label.className = "direction-label";
	direction_label.textContent =
		question.direction === "stem_to_meaning"
			? "What does this stem mean?"
			: "Which stem means this?";

	const question_text = document.createElement("div");
	question_text.className = "question-text";
	// When the prompt is a stem, render it in monospace so it visually
	// reads as a word part, not a definition.
	if (question.direction === "stem_to_meaning") {
		question_text.classList.add("prompt-is-stem");
	} else {
		question_text.classList.add("prompt-is-meaning");
	}
	question_text.textContent = question.prompt;

	question_card.appendChild(direction_chip);
	question_card.appendChild(direction_label);
	question_card.appendChild(question_text);

	// Answer buttons (2x2 grid for 4, 2x3 for 6, 2x4 for 8)
	const buttons_grid = document.createElement("div");
	buttons_grid.className = "choices-grid";
	buttons_grid.setAttribute("data-choice-count", String(question.choices.length));

	for (let i = 0; i < question.choices.length; i++) {
		const btn = document.createElement("button");
		btn.className = "choice-button";
		btn.setAttribute("data-choice-index", String(i));

		// PERMANENT SLOT IDENTITY: button fill color
		btn.style.background = slot_accent_for(i);
		btn.style.color = "#ffffff";
		btn.style.fontWeight = "900";

		// PERMANENT SLOT IDENTITY: keyboard badge (top-left corner circle with white background)
		const badge = document.createElement("span");
		badge.className = "slot-badge";
		badge.textContent = String(i + 1);
		btn.appendChild(badge);

		// Answer text
		const text_span = document.createElement("span");
		text_span.textContent = question.choices[i];
		btn.appendChild(text_span);

		btn.addEventListener("click", () => {
			on_choice(question.choices[i]);
		});

		buttons_grid.appendChild(btn);
	}

	// Mascot slot (bottom left)
	const mascot_slot = document.createElement("div");
	mascot_slot.className = "mascot-slot";
	mount_mascot(mascot_slot);

	// Home/quit button (top-right corner nav)
	const corner_nav = document.createElement("div");
	corner_nav.className = "play-corner-nav";

	const home_btn = document.createElement("button");
	home_btn.className = "btn-home-quit";
	home_btn.setAttribute("aria-label", "Return to home");
	home_btn.textContent = "Home";

	home_btn.addEventListener("click", () => {
		on_home();
	});

	corner_nav.appendChild(home_btn);

	container.appendChild(corner_nav);
	container.appendChild(top_bar);
	container.appendChild(question_card);
	container.appendChild(buttons_grid);
	container.appendChild(mascot_slot);

	return container;
}

//============================================

// Flash feedback: highlight chosen button, show praise, resolve after delay.
// On correct: auto-advance after FEEDBACK_CORRECT_MS.
// On wrong: show feedback + teaching panel, wait minimum FEEDBACK_WRONG_MS,
// then render "Tap to continue" hint and wait for click/Enter/Space before advancing.
export async function flash_answer_feedback(
	scene_el: HTMLElement,
	result: AnswerResult,
	bundle: Bundle
): Promise<void> {
	const question = result.question;
	const is_correct = result.correct;
	const chosen = result.chosen;
	const correct_answer = question.correct_choice;

	// Find the chosen button
	const chosen_index = question.choices.indexOf(chosen);
	const chosen_btn = scene_el.querySelector(
		`[data-choice-index="${chosen_index}"]`
	) as HTMLButtonElement | null;

	// Find the mascot
	const mascot_wrapper = scene_el.querySelector(".mascot-wrapper");

	// Find the choices grid to add feedback-active class during answer display
	const choices_grid = scene_el.querySelector(".choices-grid") as HTMLElement | null;
	if (choices_grid) {
		choices_grid.classList.add("feedback-active");
	}

	// Highlight chosen button with overlay-based feedback (no background swap)
	if (chosen_btn) {
		if (is_correct) {
			// CORRECT: add overlay class + checkmark badge
			chosen_btn.classList.add("feedback-correct");
			add_feedback_icon_overlay(chosen_btn, "correct");
			set_mascot_state(mascot_wrapper as HTMLElement, "cheer");

			// Burst confetti at button center
			const rect = chosen_btn.getBoundingClientRect();
			burst_confetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
		} else {
			// WRONG: add overlay class + shake + X badge
			chosen_btn.classList.add("feedback-wrong");
			add_feedback_icon_overlay(chosen_btn, "wrong");
			set_mascot_state(mascot_wrapper as HTMLElement, "wobble");

			// Highlight correct answer with overlay
			const correct_index = question.choices.indexOf(correct_answer);
			const correct_btn = scene_el.querySelector(
				`[data-choice-index="${correct_index}"]`
			) as HTMLButtonElement | null;
			if (correct_btn) {
				correct_btn.classList.add("feedback-correct-revealed");
				add_feedback_icon_overlay(correct_btn, "correct");
			}
		}
	}

	// Show praise chip
	const praise_pool = is_correct ? CORRECT_PRAISE : WRONG_PRAISE;
	const last_praise = is_correct ? last_correct_praise : last_wrong_praise;
	const praise = next_praise(praise_pool, last_praise);
	if (is_correct) {
		last_correct_praise = praise;
	} else {
		last_wrong_praise = praise;
	}

	const praise_chip = document.createElement("div");
	praise_chip.className = "praise-chip";
	praise_chip.textContent = praise;
	scene_el.appendChild(praise_chip);

	// On wrong answer, also show teaching panel
	let teaching_panel: HTMLElement | null = null;
	if (!is_correct) {
		teaching_panel = document.createElement("div");
		teaching_panel.className = "teaching-panel";
		const panel_html = build_teaching_panel({
			direction: question.direction,
			correct_stem: question.source_stem,
			chosen_answer: chosen,
			bundle,
		});
		teaching_panel.innerHTML = panel_html;
		scene_el.appendChild(teaching_panel);
	}

	if (is_correct) {
		// CORRECT: wait and auto-advance
		await new Promise<void>((resolve) => setTimeout(resolve, FEEDBACK_CORRECT_MS));
	} else {
		// WRONG: wait minimum time, then render hint and wait for input
		await new Promise<void>((resolve) => setTimeout(resolve, FEEDBACK_WRONG_MS));

		// Create "Tap to continue" hint chip (fixed bottom-center, pulsing)
		const hint_chip = document.createElement("div");
		hint_chip.className = "continue-hint";
		hint_chip.textContent = "Tap to continue";
		scene_el.appendChild(hint_chip);

		// Wait for any of: click on scene, Enter key, Space key
		await new Promise<void>((resolve) => {
			function on_click(): void {
				cleanup();
				resolve();
			}

			function on_keydown(e: KeyboardEvent): void {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					cleanup();
					resolve();
				}
			}

			function cleanup(): void {
				scene_el.removeEventListener("click", on_click);
				window.removeEventListener("keydown", on_keydown);
			}

			scene_el.addEventListener("click", on_click);
			window.addEventListener("keydown", on_keydown);
		});

		// Remove hint chip
		hint_chip.remove();
	}

	// Clean up
	if (chosen_btn) {
		chosen_btn.classList.remove("feedback-correct", "feedback-wrong");
		// Remove feedback icon overlay badges
		const icon = chosen_btn.querySelector(".feedback-icon");
		if (icon) {
			icon.remove();
		}
	}
	const correct_btn_revealed = scene_el.querySelector(".feedback-correct-revealed");
	if (correct_btn_revealed) {
		correct_btn_revealed.classList.remove("feedback-correct-revealed");
		// Remove revealed checkmark badge
		const icon = correct_btn_revealed.querySelector(".feedback-icon");
		if (icon) {
			icon.remove();
		}
	}
	if (choices_grid) {
		choices_grid.classList.remove("feedback-active");
	}
	praise_chip.remove();
	if (teaching_panel !== null) {
		teaching_panel.remove();
	}
	set_mascot_state(mascot_wrapper as HTMLElement, "idle");
}

//============================================

// Show a streak banner overlay with confetti.
export async function show_streak_banner(text: string): Promise<void> {
	const banner = document.createElement("div");
	banner.className = "streak-banner";
	banner.textContent = text;
	document.body.appendChild(banner);

	// Burst confetti at screen center
	burst_confetti(window.innerWidth / 2, window.innerHeight / 2);

	// Wait for banner duration
	await new Promise((resolve) => setTimeout(resolve, STREAK_BANNER_MS));

	banner.remove();
}
