// Home screen: lesson picker, stats, mode cards, nav buttons.

import type { Bundle } from "./types/stem";
import type { RoundConfig } from "./types/question";

export interface GameMode {
	id: string;
	title: string;
	tagline: string;
	icon: string;
	question_count: number;
	endless: boolean;
}

export interface HomeScreenOptions {
	bundle: Bundle;
	selected_lessons: number[];
	last_mode_id: string | null;
	best_score: number;
	best_streak: number;
	coin_balance: number;
	daily_goal_progress: {
		completed: number;
		total: number;
	};
	mastery_count: number;
	last_choices_by_mode: Record<string, number>;
	on_play: (config: RoundConfig) => void;
	on_lesson_toggle: (lesson_num: number, on: boolean) => void;
	on_select_all: () => void;
	on_clear: () => void;
	on_open_shop: () => void;
	on_open_goals: () => void;
	on_open_mastery: () => void;
	on_choices_changed: (mode_id: string, count: number) => void;
}

//============================================

const GAME_MODES: GameMode[] = [
	{
		id: "quick_run",
		title: "Quick Run",
		tagline: "Best for warmups",
		icon: ">>",
		question_count: 10,
		endless: false,
	},
	{
		id: "challenge",
		title: "Challenge",
		tagline: "Longer score attack",
		icon: "!!",
		question_count: 25,
		endless: false,
	},
	{
		id: "endless",
		title: "Endless",
		tagline: "How far can you go?",
		icon: "***",
		question_count: 999,
		endless: true,
	},
];

//============================================

export function render_home_screen(opts: HomeScreenOptions): HTMLElement {
	const {
		bundle,
		selected_lessons,
		last_mode_id,
		best_score,
		best_streak,
		coin_balance,
		daily_goal_progress,
		mastery_count,
		last_choices_by_mode,
		on_play,
		on_lesson_toggle,
		on_select_all,
		on_clear,
		on_open_shop,
		on_open_goals,
		on_open_mastery,
		on_choices_changed,
	} = opts;

	const container = document.createElement("div");
	container.className = "scene_home";

	// Header: title
	const header = document.createElement("div");
	header.className = "home-header";
	const title = document.createElement("h1");
	title.className = "home-title";
	title.textContent = "Stems Quiz";
	header.appendChild(title);

	// Stats row: best score, best streak, coins, daily goal, mastery
	const stats_row = document.createElement("div");
	stats_row.className = "home-stats-row";

	const best_score_el = document.createElement("div");
	best_score_el.className = "stat-item";
	const score_label = document.createElement("div");
	score_label.className = "stat-label";
	score_label.textContent = "Best Score";
	const score_value = document.createElement("div");
	score_value.className = "stat-value";
	score_value.textContent = String(best_score);
	best_score_el.appendChild(score_label);
	best_score_el.appendChild(score_value);

	const best_streak_el = document.createElement("div");
	best_streak_el.className = "stat-item";
	const streak_label = document.createElement("div");
	streak_label.className = "stat-label";
	streak_label.textContent = "Best Streak";
	const streak_value = document.createElement("div");
	streak_value.className = "stat-value";
	streak_value.textContent = String(best_streak);
	best_streak_el.appendChild(streak_label);
	best_streak_el.appendChild(streak_value);

	const coins_el = document.createElement("div");
	coins_el.className = "stat-item";
	const coins_label = document.createElement("div");
	coins_label.className = "stat-label";
	coins_label.textContent = "Coins";
	const coins_value = document.createElement("div");
	coins_value.className = "stat-value";
	coins_value.textContent = String(coin_balance);
	coins_el.appendChild(coins_label);
	coins_el.appendChild(coins_value);

	const daily_goal_el = document.createElement("div");
	daily_goal_el.className = "stat-item";
	const goal_label = document.createElement("div");
	goal_label.className = "stat-label";
	goal_label.textContent = "Daily Goals";
	const goal_value = document.createElement("div");
	goal_value.className = "stat-value";
	goal_value.textContent = `${daily_goal_progress.completed}/${daily_goal_progress.total}`;
	daily_goal_el.appendChild(goal_label);
	daily_goal_el.appendChild(goal_value);

	const mastery_el = document.createElement("div");
	mastery_el.className = "stat-item";
	const mastery_label = document.createElement("div");
	mastery_label.className = "stat-label";
	mastery_label.textContent = "Mastered";
	const mastery_value = document.createElement("div");
	mastery_value.className = "stat-value";
	mastery_value.textContent = `${mastery_count}/140`;
	mastery_el.appendChild(mastery_label);
	mastery_el.appendChild(mastery_value);

	stats_row.appendChild(best_score_el);
	stats_row.appendChild(best_streak_el);
	stats_row.appendChild(coins_el);
	stats_row.appendChild(daily_goal_el);
	stats_row.appendChild(mastery_el);

	// Control bar: select all / clear
	const control_bar = document.createElement("div");
	control_bar.className = "home-control-bar";

	const select_all_btn = document.createElement("button");
	select_all_btn.className = "btn-secondary";
	select_all_btn.textContent = "Select All";
	select_all_btn.addEventListener("click", on_select_all);

	const clear_btn = document.createElement("button");
	clear_btn.className = "btn-secondary";
	clear_btn.textContent = "Clear";
	clear_btn.addEventListener("click", on_clear);

	control_bar.appendChild(select_all_btn);
	control_bar.appendChild(clear_btn);

	// Lesson grid (4 wide x 5 tall = 20 lessons)
	const lesson_grid = document.createElement("div");
	lesson_grid.className = "lesson-grid";

	for (const lesson of bundle.lessons) {
		const card = document.createElement("div");
		card.className = "lesson-card";
		if (selected_lessons.includes(lesson.number)) {
			card.classList.add("selected");
		}

		const lesson_num = document.createElement("div");
		lesson_num.className = "lesson-number";
		lesson_num.textContent = String(lesson.number);

		const check_mark = document.createElement("div");
		check_mark.className = "lesson-check";
		check_mark.textContent = "\u2713";

		card.appendChild(lesson_num);
		card.appendChild(check_mark);

		card.addEventListener("click", () => {
			const is_selected = selected_lessons.includes(lesson.number);
			on_lesson_toggle(lesson.number, !is_selected);
		});

		lesson_grid.appendChild(card);
	}

	// Mode cards section
	const mode_section = document.createElement("div");
	mode_section.className = "mode-cards-container";

	const CHOICES_OPTIONS = [4, 6, 8];

	for (let i = 0; i < GAME_MODES.length; i++) {
		const mode = GAME_MODES[i];
		const card = document.createElement("button");
		card.className = "mode-card";
		const is_focused = mode.id === last_mode_id;
		if (is_focused) {
			card.classList.add("mode-card-focused");
		}

		const icon_div = document.createElement("div");
		icon_div.className = "mode-card-icon";
		icon_div.textContent = mode.icon;

		const title_div = document.createElement("div");
		title_div.className = "mode-card-title";
		title_div.textContent = mode.title;

		const tagline_div = document.createElement("div");
		tagline_div.className = "mode-card-tagline";
		tagline_div.textContent = mode.tagline;

		// Choices selector: 3-chip row with label
		const current_choices = last_choices_by_mode[mode.id] ?? 4;

		const choices_label = document.createElement("div");
		choices_label.className = "mode-card-choices-label";
		choices_label.textContent = "Choices:";

		const choices_grid = document.createElement("div");
		choices_grid.className = "mode-card-choices-grid";

		for (const choice_count of CHOICES_OPTIONS) {
			const chip = document.createElement("button");
			chip.className = "choices-chip";
			if (choice_count === current_choices) {
				chip.classList.add("choices-chip-active");
			}
			chip.textContent = String(choice_count);

			chip.addEventListener("click", (e: Event) => {
				e.stopPropagation();
				on_choices_changed(mode.id, choice_count);
			});

			choices_grid.appendChild(chip);
		}

		card.appendChild(icon_div);
		card.appendChild(title_div);
		card.appendChild(tagline_div);
		card.appendChild(choices_label);
		card.appendChild(choices_grid);

		card.disabled = selected_lessons.length === 0;

		card.addEventListener("click", () => {
			const config: RoundConfig = {
				selected_lesson_numbers: selected_lessons,
				endless: mode.endless,
				target_question_count: mode.question_count,
				choices_per_question: last_choices_by_mode[mode.id] ?? 4,
			};
			on_play(config);
		});

		mode_section.appendChild(card);
	}

	// Nav buttons: Shop, Goals, Mastery
	const nav_row = document.createElement("div");
	nav_row.className = "home-nav-row";

	const shop_btn = document.createElement("button");
	shop_btn.className = "btn-secondary";
	shop_btn.textContent = "Shop";
	shop_btn.addEventListener("click", on_open_shop);

	const goals_btn = document.createElement("button");
	goals_btn.className = "btn-secondary";
	goals_btn.textContent = "Goals";
	goals_btn.addEventListener("click", on_open_goals);

	const mastery_btn = document.createElement("button");
	mastery_btn.className = "btn-secondary";
	mastery_btn.textContent = "Mastery";
	mastery_btn.addEventListener("click", on_open_mastery);

	nav_row.appendChild(shop_btn);
	nav_row.appendChild(goals_btn);
	nav_row.appendChild(mastery_btn);

	// Assemble
	container.appendChild(header);
	container.appendChild(stats_row);
	container.appendChild(control_bar);
	container.appendChild(lesson_grid);
	container.appendChild(mode_section);
	container.appendChild(nav_row);

	return container;
}
