// Mastery tracking: per-stem correctness ledger and classification.

import type { Stem, Bundle } from "./types/stem";
import { load_save, mutate_save } from "./persist";
import { mastery_key } from "./types/save";

//============================================

export type MasteryClass = "mastered" | "learning" | "weak" | "untried";

//============================================

export function record_answer_for_stem(
	stem: Stem,
	correct: boolean
): { newly_mastered: boolean; was_weak_before: boolean } {
	const key = mastery_key(stem.id);
	let newly_mastered = false;

	// Capture classification BEFORE the mutate so daily-goal handlers
	// (practice_weak_stem) can credit the kid for practicing what *was* weak
	// rather than what the answer just upgraded.
	const pre_class = classify_stem(stem);
	const was_mastered = pre_class === "mastered";
	const was_weak_before = pre_class === "weak";

	mutate_save((save) => {
		if (!save.mastery[key]) {
			save.mastery[key] = {
				correct: 0,
				wrong: 0,
				last_two_correct: [],
			};
		}

		const counters = save.mastery[key];

		if (correct) {
			counters.correct += 1;
			counters.last_two_correct.push(true);
		} else {
			counters.wrong += 1;
			counters.last_two_correct.push(false);
		}

		// Keep only last 2 attempts.
		if (counters.last_two_correct.length > 2) {
			counters.last_two_correct.shift();
		}
	});

	// Check if newly mastered AFTER the update.
	const is_now_mastered = classify_stem(stem) === "mastered";
	newly_mastered = !was_mastered && is_now_mastered;

	return { newly_mastered, was_weak_before };
}

//============================================

export function classify_stem(stem: Stem): MasteryClass {
	const save = load_save();
	const key = mastery_key(stem.id);
	const counters = save.mastery[key];

	// Untried: zero attempts
	if (!counters) {
		return "untried";
	}

	const total_attempts = counters.correct + counters.wrong;
	if (total_attempts === 0) {
		return "untried";
	}

	const correct_rate = counters.correct / total_attempts;

	// Mastered: >=3 correct AND correct >= 2*wrong AND last 2 attempts both correct
	if (
		counters.correct >= 3 &&
		counters.correct >= 2 * counters.wrong &&
		counters.last_two_correct.length === 2 &&
		counters.last_two_correct[0] === true &&
		counters.last_two_correct[1] === true
	) {
		return "mastered";
	}

	// Weak: wrong_rate >= 50% OR (last attempt wrong AND <3 correct total)
	if (
		correct_rate < 0.5 ||
		(counters.last_two_correct.length > 0 &&
			counters.last_two_correct[counters.last_two_correct.length - 1] ===
				false &&
			counters.correct < 3)
	) {
		return "weak";
	}

	// Learning: any attempts, not yet mastered, wrong_rate < 50%
	if (total_attempts > 0 && correct_rate >= 0.5) {
		return "learning";
	}

	return "untried";
}

//============================================

export function mastery_summary(bundle: Bundle): {
	mastered: number;
	learning: number;
	weak: number;
	untried: number;
	total: number;
} {
	let mastered = 0;
	let learning = 0;
	let weak = 0;
	let untried = 0;

	for (const stem of bundle.all_stems) {
		const cls = classify_stem(stem);
		if (cls === "mastered") mastered++;
		else if (cls === "learning") learning++;
		else if (cls === "weak") weak++;
		else untried++;
	}

	return {
		mastered,
		learning,
		weak,
		untried,
		total: bundle.all_stems.length,
	};
}

//============================================

export function lesson_mastery(
	bundle: Bundle,
	lesson_num: number
): { mastered: number; total: number } {
	const lesson = bundle.lessons.find((l) => l.number === lesson_num);
	if (!lesson) {
		return { mastered: 0, total: 0 };
	}

	let mastered = 0;
	for (const stem of lesson.stems) {
		if (classify_stem(stem) === "mastered") {
			mastered++;
		}
	}

	return { mastered, total: lesson.stems.length };
}
