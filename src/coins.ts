// Coin economy: awards on correct answers, streaks, and round completion.
// All state persisted via src/persist.ts.

import {
	COINS_CORRECT,
	COINS_STREAK_3,
	COINS_STREAK_5,
	COINS_STREAK_10,
	COINS_STREAK_20,
	COINS_STREAK_RAMP_CAP,
	COINS_ROUND_GOOD,
	COINS_ROUND_FLAWLESS,
	COINS_MASTER_STEM,
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

	// H1-ramp: continuous per-streak bump (+1 per correct in a row, capped).
	// Stacks on top of base + tier bonuses so "number keeps going up" every Q.
	const ramp_bonus = Math.min(round.current_streak, COINS_STREAK_RAMP_CAP);
	coins_awarded += ramp_bonus;

	// H1l: Streak tiers stack on top of base + ramp.
	// Tiers: +5 @ 3, +15 @ 5, +40 @ 10, +100 @ 20.
	// Per-Q totals (base 5 + ramp + tiers): 1->+6, 3->+13, 5->+30, 10->+75, 20->+185, 30+->+195.
	if (round.current_streak >= 20) {
		coins_awarded += COINS_STREAK_20;
	}
	if (round.current_streak >= 10) {
		coins_awarded += COINS_STREAK_10;
	}
	if (round.current_streak >= 5) {
		coins_awarded += COINS_STREAK_5;
	}
	if (round.current_streak >= 3) {
		coins_awarded += COINS_STREAK_3;
	}

	mutate_save((save) => {
		save.coins += coins_awarded;
		save.lifetime_coins += coins_awarded;
	});

	return coins_awarded;
}

//============================================

// H1m: one-shot coin bonus when a stem newly transitions to mastered.
// Caller adds the returned number to round.coins_earned, matching award_correct pattern.
export function award_mastery(): number {
	mutate_save((save) => {
		save.coins += COINS_MASTER_STEM;
		save.lifetime_coins += COINS_MASTER_STEM;
	});
	return COINS_MASTER_STEM;
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
	// Good round: >= ROUND_GOOD_ACCURACY (60%)
	else if (accuracy >= ROUND_GOOD_ACCURACY) {
		coins_awarded += COINS_ROUND_GOOD;
	}

	if (coins_awarded > 0) {
		mutate_save((save) => {
			save.coins += coins_awarded;
			save.lifetime_coins += coins_awarded;
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
