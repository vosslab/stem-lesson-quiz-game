// Unit tests for src/distractor_score.ts confusability scoring.
// Run via: node --import tsx --test tests/test_distractor_score.mjs
//
// confusability_score is fully deterministic, so every case asserts an exact
// integer. The expected values are hand-computed from the scoring rules in
// score_stem_to_meaning and score_meaning_to_stem.

import test from "node:test";
import assert from "node:assert/strict";

import { confusability_score } from "../src/distractor_score.ts";

function stem(fields) {
  // Only .stem and .meaning are read by the scorer; the rest satisfy the
  // Stem shape for readers who expect a full record.
  return {
    id: "L1_x",
    lesson: "L1",
    stem: "",
    meaning: "",
    example_word: "",
    example_definition: "",
    ...fields,
  };
}

//============================================
// stem_to_meaning: +4 first letter, +3 shared 2-char substring,
// +2 length within 2, +1 same vowel pattern.

test("identical stems score the maximum 10", () => {
  const a = stem({ stem: "carn" });
  const b = stem({ stem: "carn" });
  assert.equal(confusability_score(a, b, "stem_to_meaning"), 10);
});

test("prefix overlap without matching vowel pattern scores 9", () => {
  const correct = stem({ stem: "carn" });
  const candidate = stem({ stem: "car" });
  assert.equal(confusability_score(correct, candidate, "stem_to_meaning"), 9);
});

test("dissimilar short stem scores 0", () => {
  const correct = stem({ stem: "carn" });
  const candidate = stem({ stem: "z" });
  assert.equal(confusability_score(correct, candidate, "stem_to_meaning"), 0);
});

//============================================
// meaning_to_stem: +3 shared noun, +2 length within 30%,
// +2 both single/both multi word, +1 same first letter.

test("identical meanings score the maximum 8", () => {
  const a = stem({ meaning: "flesh" });
  const b = stem({ meaning: "flesh" });
  assert.equal(confusability_score(a, b, "meaning_to_stem"), 8);
});

test("unrelated multi-word meanings score only the shape match", () => {
  const correct = stem({ meaning: "the study of life" });
  const candidate = stem({ meaning: "a big fish" });
  assert.equal(confusability_score(correct, candidate, "meaning_to_stem"), 2);
});

//============================================

test("direction selects a different scoring model for the same pair", () => {
  const correct = stem({ stem: "carn", meaning: "flesh" });
  const candidate = stem({ stem: "carn", meaning: "bone" });
  const by_stem = confusability_score(correct, candidate, "stem_to_meaning");
  const by_meaning = confusability_score(correct, candidate, "meaning_to_stem");
  assert.notEqual(by_stem, by_meaning);
});
