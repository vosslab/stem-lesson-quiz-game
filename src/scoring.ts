// Streak tracking for the active round.
// Score system removed; coins are the only reward (see src/coins.ts).
// This module only mutates streak/correct/wrong counters on the RoundState.

import type { RoundState } from "./types/question";

//============================================

export function apply_correct(round: RoundState): void {
  // Increment correct and streak counters
  round.correct_count += 1;
  round.current_streak += 1;

  // Track longest streak for end-of-round display and best_streak persistence
  if (round.current_streak > round.longest_streak) {
    round.longest_streak = round.current_streak;
  }
}

//============================================

export function apply_wrong(round: RoundState): void {
  // Increment wrong counter and reset streak
  round.wrong_count += 1;
  round.current_streak = 0;
}
