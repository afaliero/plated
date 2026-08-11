/**
 * Ingredient normalization.
 *
 * Lives in shared (not the API) because cache-key stability is what keeps the
 * Spoonacular bill down, and the client can normalize before sending so that
 * ["Chicken", "rice "] and ["rice", "chicken"] are one cache entry, not two.
 */

/** Lowercase, trim, collapse inner whitespace, drop empties, dedupe, sort. */
export function normalizeIngredients(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const item of raw) {
    const cleaned = item.trim().toLowerCase().replace(/\s+/g, " ");
    if (cleaned.length > 0) seen.add(cleaned);
  }
  return [...seen].sort();
}

/**
 * Deterministic cache key for a suggest query. Any field that changes the
 * upstream response must be part of this, or you'll serve wrong results.
 */
export function suggestCacheKey(params: {
  ingredients: readonly string[];
  limit: number;
  ranking: string;
  ignorePantry: boolean;
}): string {
  const ingredients = normalizeIngredients(params.ingredients).join(",");
  return [
    `i=${ingredients}`,
    `n=${params.limit}`,
    `r=${params.ranking}`,
    `p=${params.ignorePantry ? 1 : 0}`,
  ].join("&");
}
