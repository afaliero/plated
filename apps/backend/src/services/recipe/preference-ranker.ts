import type { RecipeSummary } from "@plated/shared";
import type { AiClientContract } from "src/services/ai/types.js";
import {
  PreferenceRankingSchema,
  preferenceRankingJsonSchema,
} from "src/services/recipe/preference-schema.js";

export interface PreferenceRankerContract {
  rank(candidates: RecipeSummary[], preferences: string): Promise<string[]>;
}

export class PreferenceRanker implements PreferenceRankerContract {
  constructor(private readonly ai: AiClientContract) {}

  async rank(
    candidates: RecipeSummary[],
    preferences: string,
  ): Promise<string[]> {
    const raw = await this.ai.createStructured<unknown>({
      task: "recipe-preference-ranking",
      instructions:
        "Rank recipes for the user's preference. Select only supplied recipe IDs. Do not invent facts, ingredients, or IDs. Return every suitable ID in preferred order and exclude only clearly unsuitable candidates.",
      input: {
        preferences,
        candidates: candidates.map((recipe) => ({
          id: recipe.id,
          title: recipe.title,
          usedIngredients: recipe.usedIngredients.map((item) => item.name),
          missedIngredients: recipe.missedIngredients.map((item) => item.name),
        })),
      },
      schema: preferenceRankingJsonSchema,
    });
    const parsed = PreferenceRankingSchema.parse(raw);
    const candidateIds = new Set(candidates.map((recipe) => recipe.id));
    const ranked = parsed.rankedRecipeIds.filter((id) => candidateIds.has(id));
    const excluded = new Set(
      parsed.excludedRecipeIds.filter((id) => candidateIds.has(id)),
    );
    return [
      ...ranked,
      ...candidates
        .map((recipe) => recipe.id)
        .filter((id) => !excluded.has(id) && !ranked.includes(id)),
    ];
  }
}
