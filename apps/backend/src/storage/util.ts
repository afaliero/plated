import type { CacheStatus } from "src/storage/cache.js";

export function logCacheAccess(
  route: string,
  status: CacheStatus,
  key: string,
  startedAt: number,
): void {
  const ms = Date.now() - startedAt;
  console.log(`[${route}] ${status.padEnd(9)} (${ms}ms) ${key}`);
}

export function cacheKey(ingredients: readonly string[]): string {
  return ingredients.join(",");
}
