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
	stems_mastered_today: number;
	seconds_played: number;
	goal_rewards_count_today: number;
};

export type SaveSchemaV1 = {
	version: typeof SAVE_SCHEMA_VERSION;
	coins: number;
	owned_themes: ThemeId[];
	equipped_theme: ThemeId;
	best_score: number;
	best_streak: number;
	lesson_selection: number[];
	last_mode_id: string | null;
	daily_goals: DailyGoalsToday | null;
	stats_today: StatsToday | null;
	mastery: Record<string, MasteryCounters>;
	last_choices_by_mode: Record<string, number>;
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
		last_mode_id: null,
		daily_goals: null,
		stats_today: null,
		mastery: {},
		last_choices_by_mode: {},
	};
	return fresh;
}

// Helper so callers do not need to import StemId just to key the mastery map.
export function mastery_key(id: StemId): string {
	return id as string;
}
