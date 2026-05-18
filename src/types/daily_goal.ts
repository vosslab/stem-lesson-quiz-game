// Daily-goal shapes. Goals refresh at local midnight, 3 per day,
// drawn from a small pool. Completion grants coins once per day.

export type GoalId =
	| "answer_10"
	| "five_in_a_row"
	| "play_5_minutes"
	| "master_new_stem";

export type DailyGoal = {
	id: GoalId;
	display_text: string;
	target: number;
	reward_coins: number;
};

export type DailyGoalProgress = {
	goal: DailyGoal;
	current: number;
	completed: boolean;
};

export type DailyGoalsToday = {
	date: string;
	progress: DailyGoalProgress[];
};
