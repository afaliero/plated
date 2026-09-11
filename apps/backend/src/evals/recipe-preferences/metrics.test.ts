import assert from "node:assert/strict";
import test from "node:test";
import {
  candidateIntegrity,
  noPreferenceAiCalls,
  topKRecall,
} from "src/evals/recipe-preferences/metrics.js";

test("preference metrics measure candidate safety and top-k relevance", () => {
  assert.equal(candidateIntegrity(["1", "2"], new Set(["1", "2", "3"])), 1);
  assert.equal(candidateIntegrity(["1", "unknown"], new Set(["1", "2"])), 0);
  assert.equal(topKRecall(["3", "1", "2"], new Set(["1", "2"]), 2), 0.5);
  assert.equal(topKRecall([], new Set(), 3), 1);
});

test("no-preference metric requires zero AI calls", () => {
  assert.equal(noPreferenceAiCalls([undefined, "", "  "]), 1);
  assert.equal(noPreferenceAiCalls([undefined, "salty"]), 0);
});
