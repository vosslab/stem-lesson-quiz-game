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
		// Phase 1 v3 additions (may be missing on v2 saves).
		shop_visited_today?: boolean;
		session_start_theme?: string | null;
		weak_stems_practiced_today?: string[];
	} | null;
	daily_goals?: {
		completion_bonuses_awarded_today?: { three: boolean; five: boolean };
	} | null;
	// Phase 1 v3 addition (may be missing on v2 saves).
	lessons_attempted_ever?: string[];
};

function migrate_to_v3(legacy: LegacySaveFields): void {
	// v2 -> v3: seed new daily-reset + lifetime tracker fields.
	// Idempotent: re-running on a fresh v3 save is a no-op (fields already set).
	const stats = legacy.stats_today;
	if (stats) {
		if (stats.shop_visited_today === undefined) {
			stats.shop_visited_today = false;
		}
		if (stats.session_start_theme === undefined) {
			stats.session_start_theme = null;
		}
		if (stats.weak_stems_practiced_today === undefined) {
			stats.weak_stems_practiced_today = [];
		}
	}
	if (legacy.lessons_attempted_ever === undefined) {
		legacy.lessons_attempted_ever = [];
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

	// Migration chain. v1 saves are discarded (no migration path defined).
	// v2 -> v3 in-place; fresh v3 saves pass through v3 idempotently.
	if (legacy.version === 2) {
		migrate_to_v3(legacy);
	} else if (legacy.version === SAVE_SCHEMA_VERSION) {
		// Idempotent: re-run v3 seeding so any missing v3 fields get defaults.
		migrate_to_v3(legacy);
	} else {
		// Unknown / future / corrupt / v1: discard rather than half-migrate.
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
