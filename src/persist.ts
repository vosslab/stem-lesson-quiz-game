// Single source of truth for localStorage reads/writes.
// One versioned key (STORAGE_KEY) holds the full SaveSchemaV1 blob.
// Other modules ask persist for typed slices; they never touch localStorage directly.

import type { SaveSchemaV1 } from "./types/save";
import { SAVE_SCHEMA_VERSION, default_save } from "./types/save";
import { STORAGE_KEY } from "./constants";

let cached_save: SaveSchemaV1 | null = null;

function read_raw(): SaveSchemaV1 {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw === null) {
		return default_save();
	}
	const parsed = JSON.parse(raw) as { version?: number; last_choices_by_mode?: unknown };
	if (parsed.version !== SAVE_SCHEMA_VERSION) {
		// Schema drift: discard old save rather than half-migrate.
		// Future versions add a migration switch here.
		return default_save();
	}
	const save = parsed as SaveSchemaV1;
	// Ensure last_choices_by_mode exists (migration path for old saves).
	if (!save.last_choices_by_mode) {
		save.last_choices_by_mode = {};
	}
	return save;
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
