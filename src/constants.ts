// Tunable constants. Keep all magic numbers here so balance changes
// are one-file edits.

export const DEFAULT_CHOICES_PER_QUESTION = 4;
export const CHOICES_OPTIONS = [4, 6, 8] as const;

// Scoring
export const POINTS_CORRECT = 10;
export const STREAK_BONUSES: { at: number; bonus: number; banner: string }[] = [
	{ at: 3, bonus: 5, banner: "Nice streak!" },
	{ at: 5, bonus: 15, banner: "On fire!" },
	{ at: 10, bonus: 50, banner: "UNSTOPPABLE!" },
	{ at: 20, bonus: 50, banner: "Legendary!" },
	{ at: 30, bonus: 50, banner: "Galaxy brain!" },
	{ at: 40, bonus: 50, banner: "Word wizard!" },
];

// Coins
export const COINS_CORRECT = 5;
export const COINS_STREAK_5 = 15;
export const COINS_STREAK_10 = 40;
export const COINS_STREAK_20 = 100;
export const COINS_ROUND_GOOD = 25;
export const COINS_ROUND_FLAWLESS = 75;
export const ROUND_GOOD_ACCURACY = 0.8;
export const DAILY_GOAL_REWARD_CAP = 10;

// Spaced-repetition retry queue
export const RETRY_QUEUE_RESURFACE_MIN = 3;
export const RETRY_QUEUE_RESURFACE_MAX = 5;

// Feedback timing (ms)
export const FEEDBACK_CORRECT_MS = 800;
// FEEDBACK_WRONG_MS: minimum gate before input accepted on wrong answer.
// Allows shake (350ms) + glow-in animations to finish before student can click
// the continue hint. Set to 600ms to ensure visual feedback is visible before input.
export const FEEDBACK_WRONG_MS = 600;
export const STREAK_BANNER_MS = 1200;

// Storage
export const STORAGE_KEY = "stems_quiz_v1";
