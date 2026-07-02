// localStorage save schema. Versioned so future migrations can detect drift.
// Single root key: stems_quiz_v1 (see src/persist.ts).

import type { LessonId, StemId } from "../brands";
import type { ThemeId } from "./cosmetic";
import type { DailyGoalsToday } from "./daily_goal";

export const SAVE_SCHEMA_VERSION = 3 as const;

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
  // M1 fix: persisted counter of goals completed today. Incremented in
  // grant_goal_rewards (which clears prog.completed after paying out), so
  // check_and_grant_completion_bonuses can no longer be blinded by the reset.
  // Reset on day rollover with the rest of stats_today.
  goals_completed_today: number;
  // Phase 1: new daily-reset fields for unhandled goal handlers.
  // shop_visited_today: flips true the first time kid opens the shop today.
  shop_visited_today: boolean;
  // session_start_theme: snapshot of equipped theme captured at the first
  // theme-equip event of the day (or first activity). Used to detect when
  // the kid swaps themes -- "use_different_theme" goal completes when the
  // current equipped theme no longer matches this snapshot.
  session_start_theme: ThemeId | null;
  // weak_stems_practiced_today: dedup list of stem ids the kid has answered
  // today where the stem was classified weak BEFORE the answer was scored.
  // First entry trips practice_weak_stem.
  weak_stems_practiced_today: StemId[];
};

export type SaveSchemaV1 = {
  version: typeof SAVE_SCHEMA_VERSION;
  coins: number;
  lifetime_coins: number;
  owned_themes: ThemeId[];
  equipped_theme: ThemeId;
  best_streak: number;
  lesson_selection: number[];
  last_mode_id: string | null;
  daily_goals: DailyGoalsToday | null;
  stats_today: StatsToday | null;
  mastery: Record<string, MasteryCounters>;
  last_choices_by_mode: Record<string, number>;
  // Phase 1: persistent lifetime tracker of every lesson the kid has ever
  // attempted (any answer recorded against a stem in that lesson). Used to
  // detect "try_new_lesson" goal -- fires when a lesson appears that is not
  // yet in this list. Never resets on day rollover.
  lessons_attempted_ever: LessonId[];
};

export function default_save(): SaveSchemaV1 {
  const fresh: SaveSchemaV1 = {
    version: SAVE_SCHEMA_VERSION,
    coins: 0,
    lifetime_coins: 0,
    owned_themes: ["sky"],
    equipped_theme: "sky",
    best_streak: 0,
    lesson_selection: [1],
    last_mode_id: null,
    daily_goals: null,
    stats_today: null,
    mastery: {},
    last_choices_by_mode: {},
    lessons_attempted_ever: [],
  };
  return fresh;
}

// Helper so callers do not need to import StemId just to key the mastery map.
export function mastery_key(id: StemId): string {
  return id;
}
