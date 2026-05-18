// Round management: start, progress, answer handling, completion.

import type { Bundle } from "./types/stem";
import type { Question, RoundConfig, RoundState, AnswerResult } from "./types/question";
import { build_round_state, pick_next_question, RetryQueue } from "./question_builder";
import { apply_correct, apply_wrong } from "./scoring";

//============================================

let global_retry_queue: RetryQueue;

//============================================

export function start_round(
	_bundle: Bundle,
	config: RoundConfig
): RoundState {
	const round = build_round_state(config);
	global_retry_queue = new RetryQueue();
	return round;
}

//============================================

export function next_question(
	bundle: Bundle,
	_round: RoundState,
	_retry: undefined
): Question {
	// Use global retry queue (placeholder for RetryHelper reference in signature)
	const question = pick_next_question(bundle, _round.config, global_retry_queue);
	global_retry_queue.increment_questions();
	return question;
}

//============================================

export function answer(
	round: RoundState,
	question: Question,
	chosen: string
): AnswerResult {
	const correct = chosen === question.correct_choice;

	let points_awarded = 0;

	if (correct) {
		const scoring_result = apply_correct(round);
		points_awarded = scoring_result.points;
		// bonus_banner from scoring_result is available if UI needs it
		void scoring_result.bonus_banner;
	} else {
		apply_wrong(round);
		global_retry_queue.push_missed(question.source_stem);
	}

	round.questions_asked += 1;

	const answer_result: AnswerResult = {
		question,
		chosen,
		correct,
		points_awarded,
		streak_after: round.current_streak,
	};

	round.answers.push(answer_result);
	return answer_result;
}

//============================================

export function is_round_over(round: RoundState): boolean {
	if (round.config.endless) {
		return false;
	}

	return round.questions_asked >= round.config.target_question_count;
}
