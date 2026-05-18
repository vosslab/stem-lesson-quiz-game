// Daily goals: refresh at local midnight, track progress, grant rewards.
// 5 per day from stratified pool. Completion bonuses at 3/5 completed.

import type {
	DailyGoal,
	DailyGoalProgress,
	DailyGoalsToday,
} from "./types/daily_goal";
import { DAILY_GOAL_REWARD_CAP } from "./constants";
import { load_save, mutate_save } from "./persist";

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

function shuffle_array<T>(arr: T[]): T[] {
	const result = [...arr];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}
