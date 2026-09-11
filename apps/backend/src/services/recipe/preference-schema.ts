import { z } from "zod";

export const PreferenceRankingSchema = z.object({
  rankedRecipeIds: z.array(z.string()).max(20),
  excludedRecipeIds: z.array(z.string()).max(20),
});

export const preferenceRankingJsonSchema = {
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
