// Question and quiz-round shapes.
// Direction picks per-question; both directions appear in every round.

import type { Stem } from "./stem";
// Importing types only to avoid circular dependency
// RetryQueue and SubjectDeck are defined in question_builder.ts
import type { RetryQueue, SubjectDeck } from "../question_builder";

export type Direction = "stem_to_meaning" | "meaning_to_stem";

export type Question = {
	direction: Direction;
	prompt: string;
	correct_choice: string;
	choices: string[];
	source_stem: Stem;
};

export type AnswerResult = {
	question: Question;
	chosen: string;
	correct: boolean;
};

export type RoundConfig = {
	selected_lesson_numbers: number[];
	endless: boolean;
	target_question_count: number;
	choices_per_question: number;
	// Mode gate: Quick Run (10 Q) disables retry to avoid in-round duplicates.
	// Challenge (25 Q) and Endless enable retry for spaced-repetition pedagogy.
	enable_retry: boolean;
};

export type RoundState = {
	config: RoundConfig;
	questions_asked: number;
	correct_count: number;
	wrong_count: number;
	current_streak: number;
	longest_streak: number;
	coins_earned: number;
	answers: AnswerResult[];
	// null when config.enable_retry=false (Quick Run); RetryQueue instance otherwise.
	retry_queue: RetryQueue | null;
	subject_deck: SubjectDeck;
};
