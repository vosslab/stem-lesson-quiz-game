// Tunable constants. Keep all magic numbers here so balance changes
// are one-file edits.

export const DEFAULT_CHOICES_PER_QUESTION = 4;
export const CHOICES_OPTIONS = [4, 6, 8] as const;

// Streak banners: visual milestones shown in the play overlay.
// Score system removed; banners trigger purely off the streak count.
export const STREAK_BANNERS: { at: number; banner: string }[] = [
	{ at: 3, banner: "Nice streak!" },
	{ at: 5, banner: "On fire!" },
	{ at: 10, banner: "UNSTOPPABLE!" },
	{ at: 20, banner: "Legendary!" },
	{ at: 30, banner: "Galaxy brain!" },
	{ at: 40, banner: "Word wizard!" },
];

// Coins
export const COINS_CORRECT = 5;
export const COINS_STREAK_3 = 5;
export const COINS_STREAK_5 = 15;
export const COINS_STREAK_10 = 40;
export const COINS_STREAK_20 = 100;
// Per-question streak ramp: bonus = min(current_streak, COINS_STREAK_RAMP_CAP).
// Stacks with COINS_CORRECT base and tier bonuses (STREAK_3/5/10/20).
// Streak 1 -> +1, streak 7 -> +7, streak 30 -> +30, streak 50 -> +30 (capped).
export const COINS_STREAK_RAMP_CAP = 30;
// H1m: one-shot bonus when a stem flips to mastered.
export const COINS_MASTER_STEM = 25;
export const COINS_ROUND_GOOD = 25;
export const COINS_ROUND_FLAWLESS = 75;
// 60% threshold: kid earns the round bonus at the same accuracy they're
// realistically hitting (paces 2 full passes at 60% to first mascot tier).
export const ROUND_GOOD_ACCURACY = 0.6;
export const DAILY_GOAL_REWARD_CAP = 15;

// Spaced-repetition retry queue (mode-gated; only active when RoundConfig.enable_retry=true).
// Gap 10-20: missed stem resurfaces ~halfway through Challenge (25 Q), never twice in a row.
export const RETRY_QUEUE_RESURFACE_MIN = 10;
export const RETRY_QUEUE_RESURFACE_MAX = 20;

// Feedback timing (ms)
export const FEEDBACK_CORRECT_MS = 800;
// FEEDBACK_WRONG_MS: minimum gate before input accepted on wrong answer.
// Allows shake (350ms) + glow-in animations to finish before student can click
// the continue hint. Set to 600ms to ensure visual feedback is visible before input.
export const FEEDBACK_WRONG_MS = 600;
export const STREAK_BANNER_MS = 1200;

// Storage
export const STORAGE_KEY = "stems_quiz_v1";
