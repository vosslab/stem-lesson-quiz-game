// Daily-goal shapes. Goals refresh at local midnight, 5 per day,
// drawn from a larger stratified pool. Completion grants coins once per day.

import type { LessonId, StemId } from "../brands";
import type { ThemeId } from "./cosmetic";
import type { RoundState } from "./question";
import type { SaveSchemaV1 } from "./save";

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

// Event union: every flavor of game activity that can move a daily goal.
// Adding a new event kind here forces every GoalDefinition.handle to either
// react or explicitly ignore -- the TS compiler narrows on event.kind.
export type GameEvent =
	| { kind: "answer"; was_correct: boolean; current_streak: number }
	| { kind: "play_seconds"; seconds: number }
	| { kind: "master_stem" }
	| { kind: "round_end"; round: RoundState }
	| { kind: "shop_visit" }
	| { kind: "theme_equipped"; theme_id: ThemeId }
	| { kind: "lesson_attempted"; lesson_ids: LessonId[] }
	| { kind: "weak_stem_practiced"; stem_id: StemId };

// A goal owns its full lifecycle: display text, target, reward, AND the
// handler that turns an incoming GameEvent into a new prog.current value.
// Handlers are side-effect-free: they read save state + event payload and
// return a number. The central dispatch (record_event in daily_goals.ts)
// is responsible for mutating save counters before calling handle().
//
// Orphan-goal prevention: GOAL_POOL is typed GoalDefinition[], so every
// pool entry MUST supply handle. A new GoalId added without a handler is
// a compile error, not a silent runtime no-op.
export type GoalDefinition = {
	id: GoalId;
	display_text: string;
	target: number;
	reward_coins: number;
	tier: GoalTier;
	handle: (
		event: GameEvent,
		prog: DailyGoalProgress,
		save: SaveSchemaV1
	) => number;
};

// Back-compat alias. Existing callers that imported DailyGoal for the
// shape of a "goal record" still work; new code should prefer
// GoalDefinition for clarity.
export type DailyGoal = GoalDefinition;

export type DailyGoalProgress = {
	goal: GoalDefinition;
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
