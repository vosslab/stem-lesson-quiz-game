// Scoring logic: apply points for correct/wrong answers, track streaks, award bonuses.

import type { RoundState } from "./types/question";
import { POINTS_CORRECT, STREAK_BONUSES } from "./constants";

//============================================

export function apply_correct(
	round: RoundState
): { points: number } {
	// Increment correct and streak counters
	round.correct_count += 1;
	round.current_streak += 1;

	// Track longest streak
	if (round.current_streak > round.longest_streak) {
		round.longest_streak = round.current_streak;
	}

	// Base points
	let total_points = POINTS_CORRECT;

	// Check for streak bonuses (ordered by threshold)
	for (const bonus of STREAK_BONUSES) {
		if (round.current_streak === bonus.at) {
			total_points += bonus.bonus;
			break;
		}
	}

	round.score += total_points;
	return { points: total_points };
}

//============================================

export function apply_wrong(round: RoundState): void {
	// Increment wrong counter and reset streak
	round.wrong_count += 1;
	round.current_streak = 0;
}
