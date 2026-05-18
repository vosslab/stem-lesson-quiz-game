// Question and quiz-round shapes.
// Direction picks per-question; both directions appear in every round.

import type { Stem } from "./stem";

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
	points_awarded: number;
	streak_after: number;
};

export type RoundConfig = {
	selected_lesson_numbers: number[];
	endless: boolean;
	target_question_count: number;
};

export type RoundState = {
	config: RoundConfig;
	questions_asked: number;
	correct_count: number;
	wrong_count: number;
	current_streak: number;
	longest_streak: number;
	score: number;
	coins_earned: number;
	answers: AnswerResult[];
};
