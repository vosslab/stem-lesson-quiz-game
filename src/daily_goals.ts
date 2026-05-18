// Daily goals: refresh at local midnight, track progress, grant rewards.
// 5 per day from stratified pool. Completion bonuses at 3/5 completed.

import type { LessonId, StemId } from "./brands";
import type {
	DailyGoal,
	DailyGoalProgress,
	DailyGoalsToday,
} from "./types/daily_goal";
import type { ThemeId } from "./types/cosmetic";
import type { RoundState } from "./types/question";
import { DAILY_GOAL_REWARD_CAP } from "./constants";
import { load_save, mutate_save } from "./persist";

// Phase 1: hardcoded accuracy threshold for accuracy_80 goal.
// Independent of ROUND_GOOD_ACCURACY (round-bonus knob) so future tuning of
// the bonus knob does not accidentally retune what the daily goal demands.
const ACCURACY_80_THRESHOLD = 0.8;

// Phase 1: target question count constants for the mode-detection goals.
// These mirror src/init.ts mode configs; if mode configs ever change, update here.
const QUICK_RUN_QUESTION_COUNT = 10;
const CHALLENGE_RUN_QUESTION_COUNT = 25;
const FLAWLESS_10_REQUIRED_CORRECT = 10;

//============================================

export const GOAL_POOL: DailyGoal[] = [
	// Easy tier: first-session reachable.
	{
		id: "answer_10",
		display_text: "Answer 10 questions today",
		target: 10,
		reward_coins: 20,
		tier: "easy",
	},
	{
		id: "play_5_minutes",
		display_text: "Play for 5 minutes",
		target: 300,
		reward_coins: 30,
		tier: "easy",
	},
	{
		id: "visit_shop",
		display_text: "Visit the shop",
		target: 1,
		reward_coins: 10,
		tier: "easy",
	},
	{
		id: "use_different_theme",
		display_text: "Use a different theme",
		target: 1,
		reward_coins: 15,
		tier: "easy",
	},
	{
		id: "accuracy_80",
		display_text: "Get 80% accuracy in a round",
		target: 1,
		reward_coins: 40,
		tier: "easy",
	},
	{
		id: "finish_quick_run",
		display_text: "Finish a Quick Run",
		target: 1,
		reward_coins: 30,
		tier: "easy",
	},
	// Medium tier: achievable with normal play.
	{
		id: "five_in_a_row",
		display_text: "Get 5 correct in a row",
		target: 5,
		reward_coins: 25,
		tier: "medium",
	},
	{
		id: "master_new_stem",
		display_text: "Master a new stem",
		target: 1,
		reward_coins: 30,
		tier: "medium",
	},
	{
		id: "try_new_lesson",
		display_text: "Try a new lesson",
		target: 1,
		reward_coins: 25,
		tier: "medium",
	},
	{
		id: "finish_challenge_run",
		display_text: "Finish a Challenge Run",
		target: 1,
		reward_coins: 50,
		tier: "medium",
	},
	{
		id: "practice_weak_stem",
		display_text: "Practice a weak stem",
		target: 1,
		reward_coins: 25,
		tier: "medium",
	},
	{
		id: "beat_streak",
		display_text: "Beat your best streak",
		target: 1,
		reward_coins: 75,
		tier: "medium",
	},
	// Hard tier: challenging.
	{
		id: "flawless_10",
		display_text: "Get a flawless 10-question run",
		target: 1,
		reward_coins: 75,
		tier: "hard",
	},
	{
		id: "master_3_stems",
		display_text: "Master 3 stems today",
		target: 3,
		reward_coins: 60,
		tier: "hard",
	},
];

//============================================

export function today_iso(): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

//============================================

export function ensure_today(): DailyGoalsToday {
	const save = load_save();
	const current_date = today_iso();

	// If no goals exist or date doesn't match, create fresh goals for today.
	if (
		save.daily_goals === null ||
		save.daily_goals.date !== current_date
	) {
		// Stratified draw: 2 easy + 2 medium + 1 hard.
		const easy = GOAL_POOL.filter((g) => g.tier === "easy");
		const medium = GOAL_POOL.filter((g) => g.tier === "medium");
		const hard = GOAL_POOL.filter((g) => g.tier === "hard");

		const selected_easy = shuffle_array([...easy]).slice(0, 2);
		const selected_medium = shuffle_array([...medium]).slice(0, 2);
		const selected_hard = shuffle_array([...hard]).slice(0, 1);

		const shuffled = shuffle_array([
			...selected_easy,
			...selected_medium,
			...selected_hard,
		]);

		const progress: DailyGoalProgress[] = shuffled.map((goal) => ({
			goal,
			current: 0,
			completed: false,
		}));

		const today: DailyGoalsToday = {
			date: current_date,
			progress,
			completion_bonuses_awarded_today: {
				three: false,
				five: false,
			},
		};

		// Reset stats for today.
		const fresh_stats = {
			date: current_date,
			questions_answered: 0,
			stems_mastered_today: 0,
			seconds_played: 0,
			goal_rewards_count_today: 0,
			// M1 fix: persisted lifetime-of-day counter; survives the
			// completed=false reset that grant_goal_rewards performs.
			goals_completed_today: 0,
			// Phase 1: new daily-reset fields. Defaults match a fresh day:
			// shop not yet visited, no session theme captured, no weak stems
			// practiced. session_start_theme stays null until the first
			// theme-equip event of the day (see record_theme_equipped).
			shop_visited_today: false,
			session_start_theme: null,
			weak_stems_practiced_today: [],
		};

		mutate_save((save) => {
			save.daily_goals = today;
			save.stats_today = fresh_stats;
		});

		return today;
	}

	return save.daily_goals;
}

//============================================

export function record_answer(
	was_correct: boolean,
	current_streak: number
): { newly_completed: DailyGoal[] } {
	ensure_today();
	const newly_completed: DailyGoal[] = [];

	mutate_save((save) => {
		if (save.stats_today === null) {
			throw new Error("stats_today is null after ensure_today");
		}
		save.stats_today.questions_answered += 1;

		if (save.daily_goals === null) {
			throw new Error("daily_goals is null after ensure_today");
		}
		for (const prog of save.daily_goals.progress) {
			if (prog.completed) continue;

			const goal = prog.goal;

			// Track answer count for "Answer 10 questions today"
			if (goal.id === "answer_10") {
				prog.current = save.stats_today.questions_answered;
				if (prog.current >= goal.target && !prog.completed) {
					prog.completed = true;
					newly_completed.push(goal);
				}
			}

			// Track streak for "Get 5 correct in a row"
			if (goal.id === "five_in_a_row") {
				if (was_correct && current_streak > prog.current) {
					prog.current = current_streak;
				}
				if (prog.current >= goal.target && !prog.completed) {
					prog.completed = true;
					newly_completed.push(goal);
				}
			}

			// Track for "Beat your best streak". save.best_streak only
			// refreshes at end-of-round (init.ts), so during play it still
			// holds the prior lifetime best - safe to compare directly.
			if (goal.id === "beat_streak") {
				if (was_correct && current_streak > save.best_streak) {
					prog.current = 1;
				}
				if (prog.current >= goal.target && !prog.completed) {
					prog.completed = true;
					newly_completed.push(goal);
				}
			}
		}
	});

	return { newly_completed };
}

//============================================

export function record_play_seconds(
	seconds: number
): { newly_completed: DailyGoal[] } {
	ensure_today();
	const newly_completed: DailyGoal[] = [];

	mutate_save((save) => {
		if (save.stats_today === null) {
			throw new Error("stats_today is null after ensure_today");
		}
		save.stats_today.seconds_played += seconds;

		if (save.daily_goals === null) {
			throw new Error("daily_goals is null after ensure_today");
		}
		for (const prog of save.daily_goals.progress) {
			if (prog.completed) continue;

			const goal = prog.goal;

			if (goal.id === "play_5_minutes") {
				prog.current = save.stats_today.seconds_played;
				if (prog.current >= goal.target && !prog.completed) {
					prog.completed = true;
					newly_completed.push(goal);
				}
			}
		}
	});

	return { newly_completed };
}

//============================================

export function record_master_stem(): { newly_completed: DailyGoal[] } {
	ensure_today();
	const newly_completed: DailyGoal[] = [];

	mutate_save((save) => {
		if (save.stats_today === null) {
			throw new Error("stats_today is null after ensure_today");
		}
		save.stats_today.stems_mastered_today += 1;

		if (save.daily_goals === null) {
			throw new Error("daily_goals is null after ensure_today");
		}
		for (const prog of save.daily_goals.progress) {
			if (prog.completed) continue;

			const goal = prog.goal;

			if (goal.id === "master_new_stem") {
				prog.current = save.stats_today.stems_mastered_today;
				if (prog.current >= goal.target && !prog.completed) {
					prog.completed = true;
					newly_completed.push(goal);
				}
			}
		}
	});

	return { newly_completed };
}

//============================================

export function grant_goal_rewards(goals: DailyGoal[]): number {
	let coins_granted = 0;

	mutate_save((save) => {
		if (!save.daily_goals || !save.stats_today) {
			return;
		}

		// Check cap: cannot grant more than DAILY_GOAL_REWARD_CAP awards per day.
		let remaining_cap =
			DAILY_GOAL_REWARD_CAP -
			save.stats_today.goal_rewards_count_today;
		if (remaining_cap <= 0) {
			return;
		}

		for (const goal of goals) {
			const progress = save.daily_goals.progress.find(
				(p) => p.goal.id === goal.id
			);
			if (!progress) continue;

			// Grant reward if goal marked as completed (not already paid out).
			if (progress.completed && remaining_cap > 0) {
				save.coins += goal.reward_coins;
				save.lifetime_coins += goal.reward_coins;
				save.stats_today.goal_rewards_count_today += 1;
				// M1 fix: bump persisted completion counter BEFORE clearing
				// the completed flag, so check_and_grant_completion_bonuses
				// can still count this goal toward the 3/5 thresholds.
				save.stats_today.goals_completed_today += 1;
				coins_granted += goal.reward_coins;
				remaining_cap -= 1;

				// Mark as paid out so we don't grant again.
				progress.completed = false;
			}
		}
	});

	return coins_granted;
}

//============================================

export function check_and_grant_completion_bonuses(): number {
	let bonus_coins = 0;

	mutate_save((save) => {
		if (!save.daily_goals || !save.stats_today) {
			return;
		}

		// M1 fix: read the persisted day-counter instead of filtering on
		// prog.completed (which grant_goal_rewards just cleared to false).
		const completed_count = save.stats_today.goals_completed_today;
		const bonuses = save.daily_goals.completion_bonuses_awarded_today;

		// Check cap: cannot grant more than DAILY_GOAL_REWARD_CAP awards per day.
		let remaining_cap =
			DAILY_GOAL_REWARD_CAP -
			save.stats_today.goal_rewards_count_today;

		// Bonus for 3 goals completed (counts as 1 award, grants 50 coins).
		if (completed_count >= 3 && !bonuses.three && remaining_cap >= 1) {
			save.coins += 50;
			save.lifetime_coins += 50;
			save.stats_today.goal_rewards_count_today += 1;
			bonus_coins += 50;
			bonuses.three = true;
			remaining_cap -= 1;
		}

		// Bonus for all 5 goals completed (counts as 1 award, grants 150 coins).
		if (completed_count >= 5 && !bonuses.five && remaining_cap >= 1) {
			save.coins += 150;
			save.lifetime_coins += 150;
			save.stats_today.goal_rewards_count_today += 1;
			bonus_coins += 150;
			bonuses.five = true;
			remaining_cap -= 1;
		}
	});

	return bonus_coins;
}

//============================================

export function get_today_answered_count(): number {
	const today = ensure_today();
	let answered_count = 0;
	for (const prog of today.progress) {
		if (prog.goal.id === "answer_10") {
			answered_count = prog.current;
			break;
		}
	}
	return answered_count;
}

//============================================

// Phase 1 handler: end-of-round goal completion.
// Checks accuracy_80, finish_quick_run, finish_challenge_run, flawless_10
// based on the round's final tallies + config. Endless rounds (config.endless)
// never trip finish_* or flawless_10 (they require a bounded run that "ends").
// accuracy_80 still fires on endless if the kid quits with 80% accuracy.
export function record_round_end(
	round: RoundState
): { newly_completed: DailyGoal[] } {
	ensure_today();
	const newly_completed: DailyGoal[] = [];

	// Compute round-level facts up front; these never change inside mutate_save.
	const total_answered = round.correct_count + round.wrong_count;
	const accuracy =
		total_answered > 0 ? round.correct_count / total_answered : 0;
	const is_quick_run =
		!round.config.endless &&
		round.config.target_question_count === QUICK_RUN_QUESTION_COUNT;
	const is_challenge_run =
		!round.config.endless &&
		round.config.target_question_count === CHALLENGE_RUN_QUESTION_COUNT;
	// flawless_10: kid answered exactly 10 questions with zero wrong.
	// Allowed in quick run (10 questions) or any other 10-question shape.
	// Endless excluded; flawless_10 implies the run finished.
	const is_flawless_10 =
		!round.config.endless &&
		round.correct_count === FLAWLESS_10_REQUIRED_CORRECT &&
		round.wrong_count === 0;
	// Accuracy goal only fires when the kid actually answered something.
	const accuracy_80_hit =
		total_answered > 0 && accuracy >= ACCURACY_80_THRESHOLD;

	mutate_save((save) => {
		if (save.daily_goals === null) {
			throw new Error("daily_goals is null after ensure_today");
		}
		for (const prog of save.daily_goals.progress) {
			if (prog.completed) continue;

			const goal = prog.goal;

			if (goal.id === "accuracy_80" && accuracy_80_hit) {
				prog.current = 1;
				prog.completed = true;
				newly_completed.push(goal);
			}

			if (goal.id === "finish_quick_run" && is_quick_run) {
				prog.current = 1;
				prog.completed = true;
				newly_completed.push(goal);
			}

			if (goal.id === "finish_challenge_run" && is_challenge_run) {
				prog.current = 1;
				prog.completed = true;
				newly_completed.push(goal);
			}

			if (goal.id === "flawless_10" && is_flawless_10) {
				prog.current = 1;
				prog.completed = true;
				newly_completed.push(goal);
			}
		}
	});

	return { newly_completed };
}

//============================================

// Phase 1 handler: kid opened the shop today.
// Idempotent -- safe to call on every shop open; only the first call of the
// day flips the flag and completes the goal.
export function record_shop_visit(): { newly_completed: DailyGoal[] } {
	ensure_today();
	const newly_completed: DailyGoal[] = [];

	mutate_save((save) => {
		if (save.stats_today === null) {
			throw new Error("stats_today is null after ensure_today");
		}
		// Set idempotently; no behavior change on repeat visits.
		save.stats_today.shop_visited_today = true;

		if (save.daily_goals === null) {
			throw new Error("daily_goals is null after ensure_today");
		}
		for (const prog of save.daily_goals.progress) {
			if (prog.completed) continue;
			if (prog.goal.id === "visit_shop") {
				prog.current = 1;
				prog.completed = true;
				newly_completed.push(prog.goal);
			}
		}
	});

	return { newly_completed };
}

//============================================

// Phase 1 handler: kid equipped a theme.
// First call of the day captures session_start_theme as the baseline; that
// call returns no completion (no swap has happened yet). Subsequent calls
// complete use_different_theme when the equipped id differs from baseline.
export function record_theme_equipped(
	theme_id: ThemeId
): { newly_completed: DailyGoal[] } {
	ensure_today();
	const newly_completed: DailyGoal[] = [];

	mutate_save((save) => {
		if (save.stats_today === null) {
			throw new Error("stats_today is null after ensure_today");
		}
		// First equip of the day: snapshot the baseline. No completion yet.
		if (save.stats_today.session_start_theme === null) {
			save.stats_today.session_start_theme = theme_id;
			return;
		}
		// Same theme as baseline: nothing to do.
		if (save.stats_today.session_start_theme === theme_id) {
			return;
		}
		// Different theme: trip the goal if it is in today's set.
		if (save.daily_goals === null) {
			throw new Error("daily_goals is null after ensure_today");
		}
		for (const prog of save.daily_goals.progress) {
			if (prog.completed) continue;
			if (prog.goal.id === "use_different_theme") {
				prog.current = 1;
				prog.completed = true;
				newly_completed.push(prog.goal);
			}
		}
	});

	return { newly_completed };
}

//============================================

// Phase 1 handler: kid attempted lessons in this round.
// Pass the list of lesson ids that were part of the round (from
// round.config.selected_lesson_numbers translated to LessonIds by caller).
// Any id not already in lessons_attempted_ever is appended; first new id
// trips try_new_lesson. Idempotent -- only previously-unseen ids count.
export function record_lesson_attempted(
	lesson_ids: LessonId[]
): { newly_completed: DailyGoal[] } {
	ensure_today();
	const newly_completed: DailyGoal[] = [];

	mutate_save((save) => {
		// Determine which lesson ids are brand new for this save (not in the
		// lifetime tracker). Append them; "any new lesson found" => goal hits.
		let saw_new_lesson = false;
		for (const lesson_id of lesson_ids) {
			if (!save.lessons_attempted_ever.includes(lesson_id)) {
				save.lessons_attempted_ever.push(lesson_id);
				saw_new_lesson = true;
			}
		}
		if (!saw_new_lesson) {
			return;
		}
		if (save.daily_goals === null) {
			throw new Error("daily_goals is null after ensure_today");
		}
		for (const prog of save.daily_goals.progress) {
			if (prog.completed) continue;
			if (prog.goal.id === "try_new_lesson") {
				prog.current = 1;
				prog.completed = true;
				newly_completed.push(prog.goal);
			}
		}
	});

	return { newly_completed };
}

//============================================

// Phase 1 handler: kid practiced a stem that was classified weak BEFORE the
// answer was scored. Caller (init.ts) must classify the stem prior to calling
// apply_correct/apply_wrong, then invoke this function with the stem id.
// First weak-stem practice of the day completes practice_weak_stem. Subsequent
// calls with new stem ids extend the dedup list but do not re-fire the goal.
export function record_weak_stem_practiced(
	stem_id: StemId
): { newly_completed: DailyGoal[] } {
	ensure_today();
	const newly_completed: DailyGoal[] = [];

	mutate_save((save) => {
		if (save.stats_today === null) {
			throw new Error("stats_today is null after ensure_today");
		}
		// Dedup: if this stem already in today's list, bail without re-firing.
		if (save.stats_today.weak_stems_practiced_today.includes(stem_id)) {
			return;
		}
		save.stats_today.weak_stems_practiced_today.push(stem_id);

		if (save.daily_goals === null) {
			throw new Error("daily_goals is null after ensure_today");
		}
		for (const prog of save.daily_goals.progress) {
			if (prog.completed) continue;
			if (prog.goal.id === "practice_weak_stem") {
				prog.current = 1;
				prog.completed = true;
				newly_completed.push(prog.goal);
			}
		}
	});

	return { newly_completed };
}

//============================================

function shuffle_array<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
