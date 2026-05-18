// Confusability scoring for distractor selection.
// Pure functions only; no side effects.

import type { Stem } from "./types/stem";
import type { Direction } from "./types/question";

//============================================
// Utility functions

function get_vowel_pattern(text: string): string {
	// Convert text to vowel (v) and consonant (c) sequence
	const normalized = text.toLowerCase();
	return normalized
		.split("")
		.map((char) => (/[aeiou]/.test(char) ? "v" : "c"))
		.join("");
}

function find_common_2char_substrings(a: string, b: string): boolean {
	// Check if a and b share any 2-character substring
	const a_lower = a.toLowerCase();
	const b_lower = b.toLowerCase();

	for (let i = 0; i < a_lower.length - 1; i++) {
		const substring = a_lower.substring(i, i + 2);
		if (b_lower.includes(substring)) {
			return true;
		}
	}

	return false;
}

function extract_nouns(text: string): Set<string> {
	// Split on whitespace, drop stopwords, return lowercase remaining words
	const stopwords = new Set(["the", "a", "an", "of", "and", "or", "to", "in", "that"]);
	const words = text
		.toLowerCase()
		.split(/\s+/)
		.filter((word) => word.length > 0 && !stopwords.has(word));
	return new Set(words);
}

function shares_key_noun(meaning1: string, meaning2: string): boolean {
	// Check if meanings share any noun (post-stopword filtering)
	const nouns1 = extract_nouns(meaning1);
	const nouns2 = extract_nouns(meaning2);

	for (const noun of nouns1) {
		if (nouns2.has(noun)) {
			return true;
		}
	}

	return false;
}

//============================================
// Scoring for stem_to_meaning direction

function score_stem_to_meaning(correct: Stem, candidate: Stem): number {
	let score = 0;

	// +4 if first letter matches
	if (
		correct.stem.length > 0 &&
		candidate.stem.length > 0 &&
		correct.stem[0].toLowerCase() === candidate.stem[0].toLowerCase()
	) {
		score += 4;
	}

	// +3 if stems share any 2-char substring
	if (find_common_2char_substrings(correct.stem, candidate.stem)) {
		score += 3;
	}

	// +2 if stem length within +/- 2 chars
	if (Math.abs(correct.stem.length - candidate.stem.length) <= 2) {
		score += 2;
	}

	// +1 if both have same vowel pattern
	const correct_pattern = get_vowel_pattern(correct.stem);
	const candidate_pattern = get_vowel_pattern(candidate.stem);
	if (correct_pattern === candidate_pattern) {
		score += 1;
	}

	return score;
}

//============================================
// Scoring for meaning_to_stem direction

function score_meaning_to_stem(correct: Stem, candidate: Stem): number {
	let score = 0;

	// +3 if meanings share a key noun
	if (shares_key_noun(correct.meaning, candidate.meaning)) {
		score += 3;
	}

	// +2 if meaning length within +/- 30% of correct
	const correct_len = correct.meaning.length;
	const candidate_len = candidate.meaning.length;
	const tolerance = Math.ceil(correct_len * 0.3);
	if (Math.abs(correct_len - candidate_len) <= tolerance) {
		score += 2;
	}

	// +2 if both meanings are single words OR both are multi-word
	const correct_word_count = correct.meaning.split(/\s+/).length;
	const candidate_word_count = candidate.meaning.split(/\s+/).length;
	const correct_is_single = correct_word_count === 1;
	const candidate_is_single = candidate_word_count === 1;
	if (correct_is_single === candidate_is_single) {
		score += 2;
	}

	// +1 if both start with same letter
	if (
		correct.meaning.length > 0 &&
		candidate.meaning.length > 0 &&
		correct.meaning[0].toLowerCase() === candidate.meaning[0].toLowerCase()
	) {
		score += 1;
	}

	return score;
}

//============================================
// Public interface

export function confusability_score(
	correct: Stem,
	candidate: Stem,
	direction: Direction
): number {
	if (direction === "stem_to_meaning") {
		return score_stem_to_meaning(correct, candidate);
	} else {
		return score_meaning_to_stem(correct, candidate);
	}
}
