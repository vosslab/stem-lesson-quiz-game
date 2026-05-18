// Single source of truth for localStorage reads/writes.
// One versioned key (STORAGE_KEY) holds the full SaveSchemaV1 blob.
// Other modules ask persist for typed slices; they never touch localStorage directly.

import type { SaveSchemaV1 } from "./types/save";
import { SAVE_SCHEMA_VERSION, default_save } from "./types/save";
import { STORAGE_KEY } from "./constants";

let cached_save: SaveSchemaV1 | null = null;

// Typed shape of fields that may appear on older saves but are no longer
// declared on SaveSchemaV1 (or have since been renamed). Reading the parsed
// blob through this type keeps the migration block free of `as any` casts.
type LegacySaveFields = {
	version?: number;
	lifetime_coins?: number;
	// v1 had a top-level best_score (scoring system removed in favor of
	// lifetime_coins). Drop on migrate.
	best_score?: number;
	// v1 had a top-level muted boolean; nothing reads it after the audio refactor.
	// Drop on migrate intentionally; document the lost preference.
	muted?: boolean;
	stats_today?: {
		date?: string;
		questions_answered?: number;
		stems_mastered_today?: number;
		seconds_played?: number;
		goal_rewards_count_today?: number;
		goals_completed_today?: number;
		// Old field name pre-rename.
		goal_rewards_granted?: number;
	} | null;
	daily_goals?: {
		completion_bonuses_awarded_today?: { three: boolean; five: boolean };
	} | null;
};

function migrate_to_v2(legacy: LegacySaveFields): void {
	// v1 -> v2: drop defunct top-level fields. `muted` is intentionally dropped
	// (no consumer remains); kids on old saves lose this preference silently.
	if (legacy.best_score !== undefined) {
		delete legacy.best_score;
	}
	if (legacy.muted !== undefined) {
		delete legacy.muted;
	}
	// Seed lifetime_coins if old save predates it.
	if (typeof legacy.lifetime_coins !== "number") {
		legacy.lifetime_coins = 0;
	}

	// stats_today fixups: rename old field, seed new counters.
	const stats = legacy.stats_today;
	if (stats) {
		if (stats.goal_rewards_granted !== undefined) {
			// Renamed; reset rather than copy stale count forward.
			stats.goal_rewards_count_today = 0;
			delete stats.goal_rewards_granted;
		}
		// M2 fix: distinguish undefined from valid 0.
		if (stats.goal_rewards_count_today === undefined) {
			stats.goal_rewards_count_today = 0;
		}
		// M1 fix: new persisted counter; seed at 0 for migrated saves.
		if (stats.goals_completed_today === undefined) {
			stats.goals_completed_today = 0;
		}
	}

	// daily_goals fixup: seed completion bonus tracker if missing.
	const dg = legacy.daily_goals;
	if (dg && !dg.completion_bonuses_awarded_today) {
		dg.completion_bonuses_awarded_today = {
			three: false,
			five: false,
		};
	}

	legacy.version = SAVE_SCHEMA_VERSION;
}

function read_raw(): SaveSchemaV1 {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw === null) {
		return default_save();
	}
	const parsed = JSON.parse(raw) as unknown;
	// Single boundary cast: route the parsed JSON through the typed migration shape.
	const legacy = parsed as LegacySaveFields;

	// v1 -> v2 in-place migration (also covers fresh v2 saves: idempotent).
	if (legacy.version === 1 || legacy.version === SAVE_SCHEMA_VERSION) {
		migrate_to_v2(legacy);
	} else {
		// Unknown / future / corrupt version: discard rather than half-migrate.
		return default_save();
	}

	return legacy as unknown as SaveSchemaV1;
}

export function load_save(): SaveSchemaV1 {
	if (cached_save === null) {
		cached_save = read_raw();
	}
	return cached_save;
}

export function save_now(): void {
	if (cached_save === null) {
		return;
	}
	const serialized = JSON.stringify(cached_save);
	localStorage.setItem(STORAGE_KEY, serialized);
}

export function mutate_save(mutator: (s: SaveSchemaV1) => void): void {
	const save = load_save();
	mutator(save);
	save_now();
}
