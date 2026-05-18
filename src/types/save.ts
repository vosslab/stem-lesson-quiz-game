// localStorage save schema. Versioned so future migrations can detect drift.
// Single root key: stems_quiz_v1 (see src/persist.ts).

import type { StemId } from "../brands";
import type { ThemeId } from "./cosmetic";
import type { DailyGoalsToday } from "./daily_goal";

export const SAVE_SCHEMA_VERSION = 1 as const;

export type MasteryCounters = {
	correct: number;
	wrong: number;
	last_two_correct: boolean[];
};

export type StatsToday = {
	date: string;
	questions_answered: number;
	correct_in_a_row_max: number;
	stems_mastered_today: number;
	seconds_played: number;
	goal_rewards_granted: number;
};

export type SaveSchemaV1 = {
	version: typeof SAVE_SCHEMA_VERSION;
	coins: number;
	owned_themes: ThemeId[];
	equipped_theme: ThemeId;
	best_score: number;
	best_streak: number;
	lesson_selection: number[];
	endless_mode: boolean;
	daily_goals: DailyGoalsToday | null;
	stats_today: StatsToday | null;
	mastery: Record<string, MasteryCounters>;
	muted: boolean;
};

export function default_save(): SaveSchemaV1 {
	const fresh: SaveSchemaV1 = {
		version: SAVE_SCHEMA_VERSION,
		coins: 0,
		owned_themes: ["sky"],
		equipped_theme: "sky",
		best_score: 0,
		best_streak: 0,
		lesson_selection: [1],
		endless_mode: false,
		daily_goals: null,
		stats_today: null,
		mastery: {},
		muted: true,
	};
	return fresh;
}

// Helper so callers do not need to import StemId just to key the mastery map.
export function mastery_key(id: StemId): string {
	return id as string;
}
