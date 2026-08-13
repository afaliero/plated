export function normalizeIngredients(raw: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const item of raw) {
    const cleaned = item.trim().toLowerCase().replace(/\s+/g, " ");
    if (cleaned.length > 0) seen.add(cleaned);
  }
  return [...seen].sort();
}
