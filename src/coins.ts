// Coin economy: awards on correct answers, streaks, and round completion.
// All state persisted via src/persist.ts.

import {
	COINS_CORRECT,
	COINS_STREAK_5,
	COINS_STREAK_10,
	COINS_STREAK_20,
	COINS_ROUND_GOOD,
	COINS_ROUND_FLAWLESS,
	ROUND_GOOD_ACCURACY,
} from "./constants";
import { load_save, mutate_save } from "./persist";
import type { RoundState } from "./types/question";

//============================================

export function get_balance(): number {
	const save = load_save();
	return save.coins;
}

//============================================

export function award_correct(round: RoundState): number {
	let coins_awarded = COINS_CORRECT;

	// Streak bonuses stack (e.g., hit 10 in a row: +15 at 5, +40 at 10, +100 at 20 total = +155).
	if (round.current_streak >= 20) {
		coins_awarded += COINS_STREAK_20;
	}
	if (round.current_streak >= 10) {
		coins_awarded += COINS_STREAK_10;
	}
	if (round.current_streak >= 5) {
		coins_awarded += COINS_STREAK_5;
	}

	mutate_save((save) => {
		save.coins += coins_awarded;
	});

	return coins_awarded;
}

//============================================

export function award_round_end(round: RoundState): number {
	let coins_awarded = 0;

	const accuracy =
		round.correct_count / (round.correct_count + round.wrong_count);

	// Flawless round: 10/10 correct
	if (round.correct_count === 10 && round.wrong_count === 0) {
		coins_awarded += COINS_ROUND_FLAWLESS;
	}
	// Good round: >= 80% accuracy
	else if (accuracy >= ROUND_GOOD_ACCURACY) {
		coins_awarded += COINS_ROUND_GOOD;
	}

	if (coins_awarded > 0) {
		mutate_save((save) => {
			save.coins += coins_awarded;
		});
	}

	return coins_awarded;
}

//============================================

export function spend(amount: number): boolean {
	const current_balance = get_balance();
	if (current_balance < amount) {
		return false;
	}

	mutate_save((save) => {
		save.coins -= amount;
	});

	return true;
}
