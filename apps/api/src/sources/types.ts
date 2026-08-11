import type {
  RecipeDetail,
  RecipeSummary,
  SuggestRequest,
} from "@plated/shared";

/**
 * The swap seam.
 *
 * Routes depend on this interface, never on Spoonacular directly. That's what
 * makes it cheap to later: switch providers, add a second provider, or slot an
 * LLM re-ranking layer in front of a provider — all without touching routes or
 * the mobile app.
 */
export interface RecipeSource {
  /** Ingredients in, summary cards out. One upstream call. */
  suggest(request: SuggestRequest): Promise<RecipeSummary[]>;

  /** Full recipe for a detail screen. Returns null when the id is unknown. */
  detail(id: string): Promise<RecipeDetail | null>;
}
