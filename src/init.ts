// Entry point. Wires all scenes through the ScreenState machine.
// Boot order: load bundle -> apply saved theme -> subscribe renderer ->
// transition to home.

import type { Bundle } from "./types/stem";
import type {
	Question,
	RoundState,
	AnswerResult,
	RoundConfig,
} from "./types/question";
import type { ScreenState } from "./types/screen";
import type { ThemeId } from "./types/cosmetic";

import { load_bundle } from "./data_loader";
import { load_save, mutate_save } from "./persist";
import { get_state, subscribe, transition } from "./screen_state";

import { start_round, answer, next_question, is_round_over } from "./round";
import { award_correct, award_round_end, get_balance } from "./coins";
import { purchase_theme } from "./cosmetics";
import {
	ensure_today,
	record_answer as record_goal_answer,
	record_master_stem,
	record_play_seconds,
	grant_goal_rewards,
} from "./daily_goals";
import { record_answer_for_stem, mastery_summary } from "./mastery";

import { render_home_screen } from "./scene_home";
import { render_results_screen } from "./scene_results";
import { render_shop_screen } from "./scene_shop";
import { render_goals_screen } from "./scene_goals";
import { render_mastery_screen } from "./scene_mastery";
import {
	render_question_screen,
	flash_answer_feedback,
	show_streak_banner,
} from "./ui_rendering";
import { bind_play_keys, bind_home_keys } from "./input";
import { streak_banner_for } from "./feedback";

let app_root: HTMLElement;
let cached_bundle: Bundle;
let active_unbind_keys: (() => void) | null = null;
let pending_question: Question | null = null;
let play_seconds_interval: ReturnType<typeof setInterval> | null = null; // Reserved for future teardown

//============================================

function set_root_content(node: HTMLElement): void {
	app_root.replaceChildren(node);
	if (active_unbind_keys !== null) {
		active_unbind_keys();
		active_unbind_keys = null;
	}
}

//============================================

function render_home(): void {
	const save = load_save();
	const today = ensure_today();
	const completed = today.progress.filter((p) => p.completed).length;
	const summary = mastery_summary(cached_bundle);

	// Callback for mode selection via keyboard
	const handle_mode_selection = (config: RoundConfig): void => {
		// Determine which mode was selected by config shape
		let mode_id = "quick_run"; // default
		if (config.endless) {
			mode_id = "endless";
		} else if (config.target_question_count === 25) {
			mode_id = "challenge";
		}
		mutate_save((s) => {
			s.last_mode_id = mode_id;
		});
		const round = start_round(cached_bundle, config);
		transition({ kind: "question", round });
	};

	const home = render_home_screen({
		bundle: cached_bundle,
		selected_lessons: save.lesson_selection,
		last_mode_id: save.last_mode_id,
		best_score: save.best_score,
		best_streak: save.best_streak,
		coin_balance: get_balance(),
		daily_goal_progress: { completed, total: today.progress.length },
		mastery_count: summary.mastered,
		last_choices_by_mode: save.last_choices_by_mode,
		on_play: (config) => {
			handle_mode_selection(config);
		},
		on_lesson_toggle: (lesson_num, on) => {
			mutate_save((s) => {
				const idx = s.lesson_selection.indexOf(lesson_num);
				if (on && idx < 0) {
					s.lesson_selection.push(lesson_num);
					s.lesson_selection.sort((a, b) => a - b);
				} else if (!on && idx >= 0) {
					s.lesson_selection.splice(idx, 1);
				}
			});
			transition({ kind: "home" });
		},
		on_select_all: () => {
			mutate_save((s) => {
				s.lesson_selection = cached_bundle.lessons.map((l) => l.number);
			});
			transition({ kind: "home" });
		},
		on_clear: () => {
			mutate_save((s) => {
				s.lesson_selection = [];
			});
			transition({ kind: "home" });
		},
		on_open_shop: () => transition({ kind: "shop" }),
		on_open_goals: () => transition({ kind: "goals" }),
		on_open_mastery: () => transition({ kind: "mastery" }),
		on_choices_changed: (mode_id, count) => {
			mutate_save((s) => {
				s.last_choices_by_mode[mode_id] = count;
			});
			transition({ kind: "home" });
		},
	});
	set_root_content(home);

	// Bind keyboard keys for mode selection: 1, 2, 3
	const GAME_MODE_CONFIGS = [
		{ id: "quick_run", endless: false, target_question_count: 10 },
		{ id: "challenge", endless: false, target_question_count: 25 },
		{ id: "endless", endless: true, target_question_count: 999 },
	];
	active_unbind_keys = bind_home_keys({
		on_mode_select: (idx) => {
			if (idx >= 0 && idx < GAME_MODE_CONFIGS.length && save.lesson_selection.length > 0) {
				const mode_config = GAME_MODE_CONFIGS[idx];
				const config: RoundConfig = {
					selected_lesson_numbers: save.lesson_selection,
					endless: mode_config.endless,
					target_question_count: mode_config.target_question_count,
					choices_per_question: save.last_choices_by_mode[mode_config.id] ?? 4,
				};
				handle_mode_selection(config);
			}
		},
	});
}

//============================================

function render_question(round: RoundState): void {
	if (is_round_over(round)) {
		finish_round(round);
		return;
	}
	const q = next_question(cached_bundle, round, undefined);
	pending_question = q;
	const screen = render_question_screen({
		question: q,
		round,
		on_choice: (chosen) => handle_choice(round, chosen),
		on_home: () => transition({ kind: "home" }),
	});
	set_root_content(screen);
	active_unbind_keys = bind_play_keys({
		on_choice: (idx) => {
			if (idx >= 0 && idx < q.choices.length) {
				const choice = q.choices[idx];
				if (choice !== undefined) {
					handle_choice(round, choice);
				}
			}
		},
		on_next: () => {
			// Pressing Enter during a question is a no-op; advancement happens
			// after flash_answer_feedback resolves.
		},
		on_home: () => transition({ kind: "home" }),
	});
}

//============================================

async function handle_choice(round: RoundState, chosen: string): Promise<void> {
	const q = pending_question;
	if (q === null) {
		return;
	}
	pending_question = null;
	const result: AnswerResult = answer(round, q, chosen);

	let coins_added = 0;
	if (result.correct) {
		coins_added = award_correct(round);
		round.coins_earned += coins_added;
	}

	// Mastery + daily goals
	const mastery_result = record_answer_for_stem(q.source_stem, result.correct);
	const goal_progress = record_goal_answer(result.correct, round.current_streak);
	const completed_goals = [...goal_progress.newly_completed];
	if (mastery_result.newly_mastered) {
		const master_result = record_master_stem();
		completed_goals.push(...master_result.newly_completed);
	}
	const goal_coins = grant_goal_rewards(completed_goals);
	round.coins_earned += goal_coins;

	const scene = app_root.firstElementChild as HTMLElement | null;
	if (scene !== null) {
		await flash_answer_feedback(scene, result, cached_bundle);
	}

	const banner = streak_banner_for(round.current_streak);
	if (banner !== null) {
		await show_streak_banner(banner);
	}

	// Re-render to show next question or finish round.
	transition({ kind: "question", round });
}

//============================================

function finish_round(round: RoundState): void {
	const end_coins = award_round_end(round);
	round.coins_earned += end_coins;

	const save = load_save();
	const new_best_score = round.score > save.best_score;
	const new_best_streak = round.longest_streak > save.best_streak;
	mutate_save((s) => {
		if (round.score > s.best_score) {
			s.best_score = round.score;
		}
		if (round.longest_streak > s.best_streak) {
			s.best_streak = round.longest_streak;
		}
	});

	transition({ kind: "results", round });
	const results = render_results_screen({
		round,
		coins_earned: round.coins_earned,
		new_best_score,
		new_best_streak,
		on_play_again: () => {
			const fresh = start_round(cached_bundle, round.config);
			transition({ kind: "question", round: fresh });
		},
		on_open_shop: () => transition({ kind: "shop" }),
		on_home: () => transition({ kind: "home" }),
	});
	set_root_content(results);
}

//============================================

function render_shop(): void {
	const screen = render_shop_screen({
		on_back: () => transition({ kind: "home" }),
		on_purchase_attempt: (id: ThemeId, _result) => {
			// Wire the purchase through cosmetics; result is reported to the scene already.
			void purchase_theme(id);
		},
	});
	set_root_content(screen);
}

//============================================

function render_goals(): void {
	const screen = render_goals_screen({
		on_back: () => transition({ kind: "home" }),
	});
	set_root_content(screen);
}

//============================================

function render_mastery(): void {
	const screen = render_mastery_screen({
		bundle: cached_bundle,
		on_back: () => transition({ kind: "home" }),
	});
	set_root_content(screen);
}

//============================================

function on_screen_change(state: ScreenState): void {
	switch (state.kind) {
		case "home":
			render_home();
			return;
		case "question":
			render_question(state.round);
			return;
		case "results":
			// finish_round renders results directly; the transition is here so
			// future subscribers can react.
			return;
		case "shop":
			render_shop();
			return;
		case "goals":
			render_goals();
			return;
		case "mastery":
			render_mastery();
			return;
	}
}

//============================================

async function main(): Promise<void> {
	const save = load_save();
	document.body.setAttribute("data-theme", save.equipped_theme);

	cached_bundle = await load_bundle();

	const root = document.getElementById("app");
	if (root === null) {
		throw new Error("Missing #app root element.");
	}
	app_root = root;

	play_seconds_interval = setInterval(() => {
		record_play_seconds(15);
	}, 15000);
	void play_seconds_interval; // Reserved for future teardown

	subscribe(on_screen_change);
	// subscribe() fires immediately with current state (home). If get_state
	// is not home for some reason, force the transition explicitly.
	if (get_state().kind !== "home") {
		transition({ kind: "home" });
	}
}

main().catch((err: unknown) => {
	const msg = err instanceof Error ? err.message : String(err);
	const root = document.getElementById("app");
	if (root !== null) {
		root.textContent = `Error: ${msg}`;
	}
});
