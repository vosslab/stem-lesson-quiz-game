// Daily-goal shapes. Goals refresh at local midnight, 5 per day,
// drawn from a larger stratified pool. Completion grants coins once per day.

export type GoalId =
	| "answer_10"
	| "five_in_a_row"
	| "play_5_minutes"
	| "master_new_stem"
	| "try_new_lesson"
	| "finish_quick_run"
	| "finish_challenge_run"
	| "accuracy_80"
	| "flawless_10"
	| "beat_streak"
	| "practice_weak_stem"
	| "master_3_stems"
	| "use_different_theme"
	| "visit_shop";

export type GoalTier = "easy" | "medium" | "hard";

export type DailyGoal = {
	id: GoalId;
	display_text: string;
	target: number;
	reward_coins: number;
	tier: GoalTier;
};

export type DailyGoalProgress = {
	goal: DailyGoal;
	current: number;
	completed: boolean;
};

export type DailyGoalsToday = {
	date: string;
	progress: DailyGoalProgress[];
	completion_bonuses_awarded_today: {
		three: boolean;
		five: boolean;
	};
};
