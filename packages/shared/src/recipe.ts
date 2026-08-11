import { z } from "zod";

/**
 * These schemas define OUR API contract — deliberately not Spoonacular's shape.
 * Keeping them vendor-neutral means swapping or supplementing the recipe source
 * later is a change inside apps/api only, not a change to the mobile app.
 *
 * `id` is a string even though Spoonacular ids are numeric, so a future source
 * with slug or uuid ids doesn't force a breaking change.
 */

export const IngredientRefSchema = z.object({
  name: z.string(),
  /** Human-readable amount, e.g. "2 cloves". Null when the source omits it. */
  amount: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
});
export type IngredientRef = z.infer<typeof IngredientRefSchema>;

/** What a results-grid card needs. Cheap: one `findByIngredients` call. */
export const RecipeSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().url().nullable(),
  /** Ingredients the user already has. */
  usedIngredients: z.array(IngredientRefSchema),
  /** Ingredients they'd still need to buy. Drives the "missing 2" badge. */
  missedIngredients: z.array(IngredientRefSchema),
  usedCount: z.number().int().nonnegative(),
  missedCount: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
});
export type RecipeSummary = z.infer<typeof RecipeSummarySchema>;

/**
 * What a detail screen needs. Requires a SECOND upstream call
 * (`/recipes/{id}/information`) — findByIngredients returns none of this.
 */
export const RecipeDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  imageUrl: z.string().url().nullable(),
  readyInMinutes: z.number().int().positive().nullable(),
  servings: z.number().int().positive().nullable(),
  /** Link back to the original recipe. Required for attribution on some tiers. */
  sourceUrl: z.string().url().nullable(),
  sourceName: z.string().nullable(),
  ingredients: z.array(IngredientRefSchema),
  /** Ordered steps. Empty when the source has no structured instructions. */
  instructions: z.array(z.string()),
});
export type RecipeDetail = z.infer<typeof RecipeDetailSchema>;
