// Question generation: direction coin-flip, distractor sampling, retry queue.

import type { Bundle } from "./types/stem";
import type { Question, RoundConfig, RoundState, Direction } from "./types/question";
import type { Stem } from "./types/stem";
import { RETRY_QUEUE_RESURFACE_MIN, RETRY_QUEUE_RESURFACE_MAX } from "./constants";
import { confusability_score } from "./distractor_score";

//============================================

export function build_round_state(config: RoundConfig): RoundState {
	return {
		config,
		questions_asked: 0,
		correct_count: 0,
		wrong_count: 0,
		current_streak: 0,
		longest_streak: 0,
		score: 0,
		coins_earned: 0,
		answers: [],
	};
}

//============================================

export class RetryQueue {
	private queue: Stem[] = [];
	private questions_since_miss: Map<string, number> = new Map();

	push_missed(stem: Stem): void {
		this.queue.push(stem);
		this.questions_since_miss.set(stem.id, 0);
	}

	increment_questions(): void {
		// Increment counter for all stems in the miss-tracking map
		for (const [key, count] of this.questions_since_miss.entries()) {
			this.questions_since_miss.set(key, count + 1);
		}
	}

	should_resurface(): Stem | null {
		// Check if queue is empty
		if (this.queue.length === 0) {
			return null;
		}

		// Get the front stem
		const stem = this.queue[0];
		const questions_passed = this.questions_since_miss.get(stem.id) ?? 0;

		// Check if enough questions have passed (3-5 randomly)
		const min = RETRY_QUEUE_RESURFACE_MIN;
		const max = RETRY_QUEUE_RESURFACE_MAX;
		const resurface_threshold = min + Math.floor(Math.random() * (max - min + 1));

		if (questions_passed >= resurface_threshold) {
			this.queue.shift();
			this.questions_since_miss.delete(stem.id);
			return stem;
		}

		return null;
	}

	length(): number {
		return this.queue.length;
	}
}

//============================================

export class SubjectDeck {
	private remaining: Stem[] = [];
	private last_cycle_tail: string[] = [];
	private current_cycle_drawn: string[] = [];

	constructor(initial_pool: Stem[]) {
		this.reshuffle(initial_pool);
	}

	private reshuffle(pool: Stem[]): void {
		// K must be small enough to allow: last K distinct from first K
		// With pool.length stems, we need pool.length >= 2K to guarantee it's possible
		// So K <= floor(pool.length / 2)
		// Cap at 4 for larger pools
		const K = Math.min(4, Math.floor((pool.length - 1) / 2));
		const tail_set = new Set(this.last_cycle_tail);

		let final_deck: Stem[] | null = null;

		// Try up to 8 reshuffles to find a deck with no seam collision
		for (let attempt = 0; attempt < 8; attempt++) {
			// Fisher-Yates shuffle
			const deck = pool.slice();
			for (let i = deck.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				const tmp = deck[i];
				deck[i] = deck[j];
				deck[j] = tmp;
			}

			// Check if first K cards have any collision with tail
			let has_collision = false;
			for (let i = 0; i < K && i < deck.length; i++) {
				if (tail_set.has(deck[i].id)) {
					has_collision = true;
					break;
				}
			}

			if (!has_collision) {
				final_deck = deck;
				break;
			}
		}

		// Use whatever deck we got (may have collisions if all 8 attempts failed)
		this.remaining = final_deck || pool.slice();

		// Reset the current cycle tracker
		this.current_cycle_drawn = [];
	}

	draw(pool: Stem[]): Stem {
		if (this.remaining.length === 0) {
			// Transitioning to a new cycle: save the tail of current cycle
			const K = Math.min(4, Math.floor((pool.length - 1) / 2));
			this.last_cycle_tail = this.current_cycle_drawn.slice(-K);
			this.reshuffle(pool);
		}

		const stem = this.remaining.shift();
		if (!stem) {
			throw new Error("SubjectDeck.draw: no stems available in deck");
		}

		this.current_cycle_drawn.push(stem.id);
		return stem;
	}

	record_drawn(_stem_id: string): void {
		// No-op: tracking happens in draw() instead
	}

	is_exhausted(): boolean {
		return this.remaining.length === 0;
	}

	remove_from_remaining(stem_id: string): void {
		this.remaining = this.remaining.filter((s) => s.id !== stem_id);
	}
}

//============================================

export function pick_next_question(
	bundle: Bundle,
	config: RoundConfig,
	retry_queue: RetryQueue,
	subject_deck: SubjectDeck
): Question {
	// Build the filtered pool (stems matching selected lessons, fallback to all stems)
	const selected_stems = bundle.all_stems.filter((stem) => {
		const lesson_num_str = stem.lesson.substring(1);
		const lesson_num = Number(lesson_num_str);
		return config.selected_lesson_numbers.includes(lesson_num);
	});
	const pool = selected_stems.length > 0 ? selected_stems : bundle.all_stems;

	// Try to resurface from retry queue
	const resurface_stem = retry_queue.should_resurface();
	let selected_stem = resurface_stem;

	if (!selected_stem) {
		// Draw from deck
		selected_stem = subject_deck.draw(pool);
	} else {
		// If resurfacing from retry queue, remove it from the deck to avoid re-drawing
		subject_deck.remove_from_remaining(selected_stem.id);
	}

	// Record the selected stem in the deck (for seam tracking on reshuffle)
	subject_deck.record_drawn(selected_stem.id);

	// Coin-flip direction
	const direction: Direction = Math.random() < 0.5 ? "stem_to_meaning" : "meaning_to_stem";

	// Build prompt and correct choice based on direction
	let prompt: string;
	let correct_choice: string;

	if (direction === "stem_to_meaning") {
		prompt = selected_stem.stem;
		correct_choice = selected_stem.meaning;
	} else {
		prompt = selected_stem.meaning;
		correct_choice = selected_stem.stem;
	}

	// Build candidate pool: same-lesson siblings first, then cross-lesson
	const same_lesson_stems = bundle.all_stems.filter(
		(stem) => stem.lesson === selected_stem.lesson && stem.id !== selected_stem.id
	);

	let candidate_pool = [...same_lesson_stems];

	// Determine how many distractors needed based on choices_per_question
	const distractor_count = config.choices_per_question - 1;
	// Cap the candidate pool size: fetch top-(distractor_count-1)*2 to ensure diversity
	// but no less than 6 for fallback cases (e.g., if only 4 distractors needed, still sample from top 6)
	const top_n_cap = Math.max(6, (distractor_count - 1) * 2);

	// If pool has < top_n_cap unique-by-answer candidates, extend with cross-lesson stems
	const candidate_choices = new Set<string>();
	candidate_choices.add(correct_choice);

	for (const stem of candidate_pool) {
		const choice_value =
			direction === "stem_to_meaning" ? stem.meaning : stem.stem;
		candidate_choices.add(choice_value);
	}

	if (candidate_choices.size < top_n_cap) {
		const cross_lesson_stems = bundle.all_stems.filter(
			(stem) =>
				stem.lesson !== selected_stem.lesson &&
				!same_lesson_stems.some((d) => d.id === stem.id)
		);

		for (const stem of cross_lesson_stems) {
			const choice_value =
				direction === "stem_to_meaning" ? stem.meaning : stem.stem;

			if (!candidate_choices.has(choice_value)) {
				candidate_choices.add(choice_value);
				candidate_pool.push(stem);
			}

			if (candidate_choices.size >= top_n_cap) {
				break;
			}
		}
	}

	// Score every candidate via confusability_score
	const scored_candidates = candidate_pool.map((stem) => ({
		stem,
		score: confusability_score(selected_stem, stem, direction),
	}));

	// Sort descending by score
	scored_candidates.sort((a, b) => b.score - a.score);

	// Take top-N (where N = top_n_cap)
	const top_n_stems = scored_candidates.slice(0, top_n_cap).map((sc) => sc.stem);

	// Clamp actual distractor count to pool size
	// If we can't get distractor_count distractors, use what we have
	const actual_distractor_count = Math.min(distractor_count, top_n_stems.length);

	// Randomly select actual_distractor_count from top_n
	const selected_distractors: Stem[] = [];
	const selected_indices = new Set<number>();

	for (let i = 0; i < actual_distractor_count && top_n_stems.length > 0; i++) {
		let idx: number;
		do {
			idx = Math.floor(Math.random() * top_n_stems.length);
		} while (selected_indices.has(idx) && selected_indices.size < top_n_stems.length);

		selected_indices.add(idx);
		selected_distractors.push(top_n_stems[idx]);
	}

	// Log once to console if we had to clamp
	if (actual_distractor_count < distractor_count) {
		console.log(
			`Distractor pool clamped: requested ${distractor_count}, ` +
			`got ${actual_distractor_count} (lesson has limited stems)`
		);
	}

	// Wildcard escape: with 15% chance, replace one distractor with random from full pool
	if (selected_distractors.length > 0 && Math.random() < 0.15) {
		const replacement_idx = Math.floor(Math.random() * selected_distractors.length);
		const wildcard_stem = candidate_pool[Math.floor(Math.random() * candidate_pool.length)];
		selected_distractors[replacement_idx] = wildcard_stem;
	}

	// Build the choices array (correct + 3 distractors)
	const distractor_choices = new Set<string>();
	distractor_choices.add(correct_choice);

	const distractors = selected_distractors
		.map((stem) => (direction === "stem_to_meaning" ? stem.meaning : stem.stem))
		.filter((choice) => {
			if (distractor_choices.has(choice)) {
				return false;
			}
			distractor_choices.add(choice);
			return true;
		});

	const choices = [correct_choice, ...distractors];

	// Shuffle choices
	for (let i = choices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = choices[i];
		choices[i] = choices[j];
		choices[j] = temp;
	}

	return {
		direction,
		prompt,
		correct_choice,
		choices,
		source_stem: selected_stem,
	};
}
