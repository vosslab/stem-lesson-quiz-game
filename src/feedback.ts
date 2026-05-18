// Praise pools and feedback helper functions (pure, no DOM).

import type { Stem, Bundle } from "./types/stem";
import type { Direction } from "./types/question";
import { STREAK_BONUSES } from "./constants";

export const CORRECT_PRAISE: string[] = [
	"Got it!",
	"Yes!",
	"Nailed it!",
	"Smart!",
	"Boom!",
	"Sharp!",
	"Crisp!",
	"Locked in!",
];

export const WRONG_PRAISE: string[] = [
	"Almost!",
	"Close one!",
	"Next time!",
	"So close!",
];

//============================================

// Return a random entry from pool, never the same as last.
export function next_praise(pool: string[], last: string | null): string {
	if (pool.length === 1) {
		return pool[0];
	}
	let choice: string;
	do {
		choice = pool[Math.floor(Math.random() * pool.length)];
	} while (choice === last);
	return choice;
}

//============================================

// Build a teaching panel HTML contrasting the kid's wrong choice with the correct answer.
// Shows both in stem &harr; meaning form regardless of direction.
// Returns the HTML string for the panel content.
export function build_teaching_panel(opts: {
	direction: Direction;
	correct_stem: Stem;
	chosen_answer: string;
	bundle: Bundle;
}): string {
	const { direction, correct_stem, chosen_answer, bundle } = opts;

	// Find the stem that matches the chosen answer.
	// If direction is stem_to_meaning, chosen is a meaning; find the stem with that meaning.
	// If direction is meaning_to_stem, chosen is a stem; find the stem with that stem value.
	let chosen_stem: Stem | undefined;
	if (direction === "stem_to_meaning") {
		// chosen_answer is a meaning; find stem by meaning match
		chosen_stem = bundle.all_stems.find((s) => s.meaning === chosen_answer);
	} else {
		// chosen_answer is a stem; find stem by stem match
		chosen_stem = bundle.all_stems.find((s) => s.stem === chosen_answer);
	}

	// If we can't find it, gracefully show what we have
	if (!chosen_stem) {
		return "";
	}

	// Format: "You picked: [stem] = [meaning]" and "Correct: [stem] = [meaning]"
	const picked_line = `You picked: <span class="teaching-stem">${chosen_stem.stem}</span> = <span class="teaching-meaning">${chosen_stem.meaning}</span>`;
	const correct_line = `Correct: <span class="teaching-stem">${correct_stem.stem}</span> = <span class="teaching-meaning">${correct_stem.meaning}</span>`;

	return `<div class="teaching-row">${picked_line}</div><div class="teaching-row">${correct_line}</div>`;
}

//============================================

// Return the banner text for a streak milestone, or null if not a milestone.
// Handles fixed milestones (3, 5, 10, 20, 30, 40) and every 10 thereafter via cycling.
export function streak_banner_for(streak: number): string | null {
	// Check fixed milestones from STREAK_BONUSES
	for (const bonus of STREAK_BONUSES) {
		if (streak === bonus.at) {
			return bonus.banner;
		}
	}

	// For streak >= 10, cycle through every 10 thereafter
	if (streak >= 10 && streak % 10 === 0) {
		// Determine which cycling message to use based on (streak / 10) % 3
		const cycle_index = ((streak / 10) - 1) % 3;
		const cycle_messages = ["Legendary!", "Galaxy brain!", "Word wizard!"];
		return cycle_messages[cycle_index];
	}

	return null;
}
