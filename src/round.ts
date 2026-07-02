// Round management: start, progress, answer handling, completion.

import type { Bundle, Stem } from "./types/stem";
import type { Question, RoundConfig, RoundState, AnswerResult } from "./types/question";
import { build_round_state, pick_next_question, RetryQueue, SubjectDeck } from "./question_builder";
import { apply_correct, apply_wrong } from "./scoring";

//============================================

//============================================

export function start_round(bundle: Bundle, config: RoundConfig): RoundState {
  const round = build_round_state(config);

  // Mode gate: Quick Run (enable_retry=false) keeps retry_queue null to avoid
  // in-round duplicates. Challenge/Endless instantiate the real queue.
  if (config.enable_retry) {
    round.retry_queue = new RetryQueue();
  }

  // Build the initial pool for the deck
  const selected_stems = bundle.all_stems.filter((stem) => {
    const lesson_num_str = stem.lesson.substring(1);
    const lesson_num = Number(lesson_num_str);
    return config.selected_lesson_numbers.includes(lesson_num);
  });
  const base_pool = selected_stems.length > 0 ? selected_stems : bundle.all_stems;

  // Pool-doubling for focused single-lesson runs: if the kid selected a
  // thin pool (e.g. one 7-stem lesson for a 10-question Quick Run),
  // repeat the pool until it covers the round target. Honors the kid's
  // focus intent ("I want this lesson") instead of borrowing from
  // elsewhere or short-cutting the round.
  const target = config.endless ? base_pool.length : config.target_question_count;
  const pool = inflate_pool_to_target(base_pool, target);

  round.subject_deck = new SubjectDeck(pool);
  return round;
}

//============================================

function inflate_pool_to_target(base: Stem[], target: number): Stem[] {
  if (base.length === 0 || base.length >= target) {
    return base;
  }
  const copies_needed = Math.ceil(target / base.length);
  const inflated: Stem[] = [];
  for (let i = 0; i < copies_needed; i++) {
    inflated.push(...base);
  }
  return inflated;
}

//============================================

export function next_question(bundle: Bundle, round: RoundState): Question {
  // Use retry queue (when enabled) and subject deck from round state.
  const question = pick_next_question(bundle, round.config, round.retry_queue, round.subject_deck);
  if (round.retry_queue) {
    round.retry_queue.increment_questions();
  }
  return question;
}

//============================================

export function answer(round: RoundState, question: Question, chosen: string): AnswerResult {
  const correct = chosen === question.correct_choice;

  if (correct) {
    apply_correct(round);
  } else {
    apply_wrong(round);
    // Mode-gated: push missed stem only when retry queue is active.
    if (round.retry_queue) {
      round.retry_queue.push_missed(question.source_stem);
    }
  }

  round.questions_asked += 1;

  const answer_result: AnswerResult = {
    question,
    chosen,
    correct,
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
