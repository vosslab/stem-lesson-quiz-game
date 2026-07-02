// Unit tests for src/scoring.ts round streak counters.
// Run via: node --import tsx --test tests/test_scoring.mjs

import test from "node:test";
import assert from "node:assert/strict";

import { apply_correct, apply_wrong } from "../src/scoring.ts";

function fresh_round() {
  // Minimal RoundState slice: the scoring functions touch only these four
  // counters, so a partial object is enough to exercise them.
  return {
    correct_count: 0,
    wrong_count: 0,
    current_streak: 0,
    longest_streak: 0,
  };
}

test("apply_correct increments correct_count and streak", () => {
  const round = fresh_round();
  apply_correct(round);
  assert.equal(round.correct_count, 1);
  assert.equal(round.current_streak, 1);
  assert.equal(round.longest_streak, 1);
});

test("apply_correct tracks the longest streak seen", () => {
  const round = fresh_round();
  apply_correct(round);
  apply_correct(round);
  apply_correct(round);
  assert.equal(round.current_streak, 3);
  assert.equal(round.longest_streak, 3);
});

test("apply_wrong resets the current streak but keeps longest", () => {
  const round = fresh_round();
  apply_correct(round);
  apply_correct(round);
  apply_wrong(round);
  assert.equal(round.wrong_count, 1);
  assert.equal(round.current_streak, 0);
  assert.equal(round.longest_streak, 2);
});

test("a streak after a miss cannot lower the recorded longest", () => {
  const round = fresh_round();
  apply_correct(round);
  apply_correct(round);
  apply_wrong(round);
  apply_correct(round);
  assert.equal(round.current_streak, 1);
  assert.equal(round.longest_streak, 2);
});
