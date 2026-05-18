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

// Backfill top-level required fields that older saves predate. Each newer
// schema bump added top-level keys (lifetime_coins, owned_themes, etc.). If a
// migrated v2 save lacks them, downstream code like `save.lifetime_coins += x`
// produces NaN that then persists. Seeding from default_save() heals the blob
// without wiping the kid's coins, mastery, or owned themes.
function backfill_top_level(legacy: LegacySaveFields): void {
	const defaults = default_save();
	const blob = legacy as unknown as Record<string, unknown>;
	const defaults_blob = defaults as unknown as Record<string, unknown>;
	for (const key of Object.keys(defaults_blob)) {
		if (blob[key] === undefined || blob[key] === null) {
			blob[key] = defaults_blob[key];
		}
	}
}

function read_raw(): SaveSchemaV1 {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw === null) {
		return default_save();
	}
	// Defensive: any parse/migration failure on a stale or corrupt blob must
	// not break boot. Falling back to default_save lets the app boot cleanly
	// and the kid can keep playing. The 2-line try is the only one in this
	// module and is justified by the boot-blocker risk.
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return default_save();
	}
	if (parsed === null || typeof parsed !== "object") {
		return default_save();
	}
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

	// Seed any top-level fields missing from older v2 saves before adopting.
	backfill_top_level(legacy);

	return legacy as unknown as SaveSchemaV1;
}

export function reset_save(): void {
	// Hard reset: wipe persisted save and in-memory cache. Next load_save()
	// returns a fresh default. Used by the home-screen "Reset save" button
	// to recover kids stuck on a deploy with a broken localStorage blob.
	localStorage.removeItem(STORAGE_KEY);
	cached_save = null;
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
