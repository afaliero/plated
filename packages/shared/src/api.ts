import { z } from "zod";
import { RecipeDetailSchema, RecipeSummarySchema } from "./recipe";

/** Guardrail: each returned recipe costs upstream quota, so cap the page size. */
export const MAX_SUGGEST_LIMIT = 20;
export const DEFAULT_SUGGEST_LIMIT = 10;
export const MAX_INGREDIENTS = 25;

export const SuggestRequestSchema = z.object({
  ingredients: z
    .array(z.string().min(1))
    .min(1, "Add at least one ingredient")
    .max(MAX_INGREDIENTS),
  limit: z
    .number()
    .int()
    .min(1)
    .max(MAX_SUGGEST_LIMIT)
    .default(DEFAULT_SUGGEST_LIMIT),
  /**
   * "maximize-used"  -> prefer recipes using the most of what they have
   * "minimize-missing" -> prefer recipes needing the fewest extra purchases
   */
  ranking: z
    .enum(["maximize-used", "minimize-missing"])
    .default("minimize-missing"),
  /** Ignore staples like salt, water, flour when computing what's missing. */
  ignorePantry: z.boolean().default(true),
});
export type SuggestRequest = z.infer<typeof SuggestRequestSchema>;
/** Pre-parse shape: what a caller may send, with defaults still optional. */
export type SuggestRequestInput = z.input<typeof SuggestRequestSchema>;

export const SuggestResponseSchema = z.object({
  recipes: z.array(RecipeSummarySchema),
});
export type SuggestResponse = z.infer<typeof SuggestResponseSchema>;

export const RecipeDetailResponseSchema = z.object({
  recipe: RecipeDetailSchema,
});
export type RecipeDetailResponse = z.infer<typeof RecipeDetailResponseSchema>;

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "bad_request",
      "not_found",
      "upstream_error",
      "quota_exceeded",
      "internal_error",
    ]),
    message: z.string(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiErrorCode = ApiError["error"]["code"];
