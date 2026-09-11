import OpenAI from "openai";
import { z } from "zod";
import type { RecipeSummary } from "@plated/shared";

const RankingSchema = z.object({
  rankedRecipeIds: z.array(z.string()).max(20),
  excludedRecipeIds: z.array(z.string()).max(20),
});

const rankingJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rankedRecipeIds: { type: "array", items: { type: "string" }, maxItems: 20 },
    excludedRecipeIds: {
      type: "array",
      items: { type: "string" },
      maxItems: 20,
    },
  },
  required: ["rankedRecipeIds", "excludedRecipeIds"],
};

export interface PreferenceRankerContract {
  rank(candidates: RecipeSummary[], preferences: string): Promise<string[]>;
}

export class PreferenceRanker implements PreferenceRankerContract {
  private client: OpenAI | null = null;

  constructor(private readonly apiKey: string | undefined) {}

  async rank(
    candidates: RecipeSummary[],
    preferences: string,
  ): Promise<string[]> {
    if (!this.apiKey) throw new Error("OPENAI_API_KEY is not configured.");
    this.client ??= new OpenAI({ apiKey: this.apiKey });
    const response = await this.client.responses.create({
      model: "gpt-5.6-luna",
      store: false,
      instructions:
        "Rank recipes for the user's preference. Select only supplied recipe IDs. Do not invent facts, ingredients, or IDs. Return every suitable ID in preferred order and exclude only clearly unsuitable candidates.",
      input: JSON.stringify({
        preferences,
        candidates: candidates.map((recipe) => ({
          id: recipe.id,
          title: recipe.title,
          usedIngredients: recipe.usedIngredients.map((item) => item.name),
          missedIngredients: recipe.missedIngredients.map((item) => item.name),
        })),
      }),
      text: {
        format: {
          type: "json_schema",
          name: "recipe_preference_ranking",
          strict: true,
          schema: rankingJsonSchema,
        },
      },
    });
    const parsed = RankingSchema.parse(JSON.parse(response.output_text));
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
