// Daily goals: refresh at local midnight, track progress, grant rewards.

import type {
	DailyGoal,
	DailyGoalProgress,
	DailyGoalsToday,
} from "./types/daily_goal";
import { DAILY_GOAL_REWARD_CAP } from "./constants";
import { load_save, mutate_save } from "./persist";

//============================================

export const GOAL_POOL: DailyGoal[] = [
	{
		id: "answer_10",
		display_text: "Answer 10 questions today",
		target: 10,
		reward_coins: 20,
	},
	{
		id: "five_in_a_row",
		display_text: "Get 5 correct in a row",
		target: 5,
		reward_coins: 25,
	},
	{
		id: "play_5_minutes",
		display_text: "Play for 5 minutes",
		target: 300,
		reward_coins: 30,
	},
	{
		id: "master_new_stem",
		display_text: "Master a new stem",
		target: 1,
		reward_coins: 30,
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
		// Pick 3 goals from pool (or all if pool < 3).
		const goal_count = Math.min(3, GOAL_POOL.length);
		const shuffled = shuffle_array([...GOAL_POOL]).slice(0, goal_count);

		const progress: DailyGoalProgress[] = shuffled.map((goal) => ({
			goal,
			current: 0,
			completed: false,
		}));

		const today: DailyGoalsToday = {
			date: current_date,
			progress,
		};

		// Reset stats for today.
		const fresh_stats = {
			date: current_date,
			questions_answered: 0,
			correct_in_a_row_max: 0,
			stems_mastered_today: 0,
			seconds_played: 0,
			goal_rewards_granted: 0,
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

		// Check cap: cannot grant more than DAILY_GOAL_REWARD_CAP per day.
		const remaining_cap =
			DAILY_GOAL_REWARD_CAP -
			save.stats_today.goal_rewards_granted;
		if (remaining_cap <= 0) {
			return;
		}

		for (const goal of goals) {
			const progress = save.daily_goals.progress.find(
				(p) => p.goal.id === goal.id
			);
			if (!progress) continue;

			// Only grant if not already marked as completed (avoid double-dipping).
			if (progress.completed) {
				const coins_to_grant = Math.min(
					goal.reward_coins,
					remaining_cap
				);
				if (coins_to_grant > 0) {
					save.coins += coins_to_grant;
					save.stats_today.goal_rewards_granted += coins_to_grant;
					coins_granted += coins_to_grant;

					// Reset for next call (mark as already granted).
					progress.completed = false;
				}
			}
		}
	});

	return coins_granted;
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
