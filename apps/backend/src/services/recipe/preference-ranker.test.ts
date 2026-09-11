import assert from "node:assert/strict";
import test from "node:test";
import type { RecipeSummary } from "@plated/shared";
import { PreferenceRanker } from "src/services/recipe/preference-ranker.js";

const candidates: RecipeSummary[] = ["1", "2", "3", "4", "3"].map((id) => ({
  id,
  title: `Recipe ${id}`,
  imageUrl: null,
  usedIngredients: [],
  missedIngredients: [],
  usedCount: 0,
  missedCount: 0,
  likes: 0,
}));

test("deduplicates ranked and remaining IDs while preserving preference order", async () => {
  const ranker = new PreferenceRanker({
    async createStructured<T>() {
      return {
        rankedRecipeIds: ["2", "2", "unknown", "1", "2"],
        excludedRecipeIds: ["4"],
      } as T;
    },
  });

  assert.deepEqual(await ranker.rank(candidates, "salty"), ["2", "1", "3"]);
});
