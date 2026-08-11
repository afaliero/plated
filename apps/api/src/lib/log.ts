import type { CacheStatus } from "@/lib/cache.js";

/**
 * One line per handled request, on top of hono's `logger()` middleware.
 *
 * The middleware already gives you method, path, status and latency. What it
 * can't see is the POST body or whether the response cost upstream quota, so
 * that's what this adds:
 *
 *   [suggest] miss      (1284ms) i=broccoli,chicken,rice&n=10&r=minimize-missing&p=1
 *   [suggest] coalesced (1284ms) i=broccoli,chicken,rice&n=10&r=minimize-missing&p=1
 *   [suggest] hit       (0ms) i=broccoli,chicken,rice&n=10&r=minimize-missing&p=1
 *
 * Grep `miss` to count what you actually spent against the daily quota.
 */
export function logCacheAccess(
  route: string,
  status: CacheStatus,
  key: string,
  startedAt: number,
): void {
  const ms = Date.now() - startedAt;
  // Pad to the width of "coalesced" so the status column stays scannable.
  console.log(`[${route}] ${status.padEnd(9)} (${ms}ms) ${key}`);
}
