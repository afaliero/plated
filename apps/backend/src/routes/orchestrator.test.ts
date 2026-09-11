import assert from "node:assert/strict";
import test from "node:test";
import type { FridgeItem, RecipeSummary } from "@plated/shared";
import { Orchestrator } from "src/routes/orchestrator.js";
import type { FridgeServiceContract } from "src/services/fridge/types.js";
import type { PreferenceRankerContract } from "src/services/recipe/preference-ranker.js";
import type { RecipeServiceContract } from "src/services/recipe/types.js";

const fridgeItems: FridgeItem[] = [{ id: 1, name: "lemon" }];
const recipes: RecipeSummary[] = [
  {
    id: "1",
    title: "Lemon rice",
    imageUrl: null,
    usedIngredients: [],
    missedIngredients: [],
    usedCount: 1,
    missedCount: 0,
    likes: 0,
  },
  {
    id: "2",
    title: "Lemon soup",
    imageUrl: null,
    usedIngredients: [],
    missedIngredients: [],
    usedCount: 1,
    missedCount: 0,
    likes: 0,
  },
];

function setup(ranker?: PreferenceRankerContract) {
  let calls = 0;
  const recipeService: RecipeServiceContract = {
    async suggest() {
      calls += 1;
      return recipes;
    },
    async detail() {
      return null;
    },
  };
  const fridgeService: FridgeServiceContract = {
    async list() {
      return fridgeItems;
    },
    async add() {
      return fridgeItems;
    },
    async remove() {
      return fridgeItems;
    },
  };
  return {
    orchestrator: new Orchestrator(recipeService, fridgeService, ranker),
    getCalls: () => calls,
  };
}

test("does not invoke the ranker without preferences", async () => {
  let rankCalls = 0;
  const { orchestrator, getCalls } = setup({
    rank: async () => {
      rankCalls += 1;
      return ["2", "1"];
    },
  });
  const result = await orchestrator.suggestFridgeRecipes(1, {
    ingredients: ["ignored"],
    limit: 10,
    ranking: "minimize-missing",
    ignorePantry: true,
  });
  assert.deepEqual(result, recipes);
  assert.equal(rankCalls, 0);
  assert.equal(getCalls(), 1);
});

test("orders known candidates with preferences and falls back on ranker failure", async () => {
  const ranked = setup({ rank: async () => ["2", "not-a-candidate", "1"] });
  const rankedResult = await ranked.orchestrator.suggestFridgeRecipes(1, {
    ingredients: ["ignored"],
    preferences: "salty",
    limit: 10,
    ranking: "minimize-missing",
    ignorePantry: true,
  });
  assert.deepEqual(
    rankedResult.map((recipe) => recipe.id),
    ["2", "1"],
  );

  const failed = setup({
    rank: async () => {
      throw new Error("offline");
    },
  });
  const failedResult = await failed.orchestrator.suggestFridgeRecipes(1, {
    ingredients: ["ignored"],
    preferences: "salty",
    limit: 10,
    ranking: "minimize-missing",
    ignorePantry: true,
  });
  assert.deepEqual(failedResult, recipes);
});
