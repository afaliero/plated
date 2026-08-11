/**
 * In-memory TTL cache with single-flight de-duplication.
 *
 * Every upstream call costs Spoonacular quota, so two things matter here:
 *   1. TTL reuse  — repeat searches within the window are free.
 *   2. Single-flight — N concurrent misses for the same key make ONE upstream
 *      call, not N. Without this, a burst of identical requests burns quota
 *      linearly for no reason.
 *
 * This is per-process. If you scale to multiple instances, swap the Map for
 * Redis — the getOrSet signature is designed to survive that change.
 */

type Entry<T> = { value: T; expiresAt: number };

/**
 * How a value was obtained. Callers log this, and the distinction matters:
 * only "miss" spent upstream quota. "coalesced" is a request that joined an
 * in-flight fetch for the same key — free, but for a different reason than a
 * TTL hit, and worth seeing separately when you're tuning the TTL.
 */
export type CacheStatus = "hit" | "coalesced" | "miss";

export type CacheResult<T> = { value: T; status: CacheStatus };

export class TtlCache {
  readonly #store = new Map<string, Entry<unknown>>();
  readonly #inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly ttlSeconds: number) {}

  async getOrSet<T>(key: string, load: () => Promise<T>): Promise<CacheResult<T>> {
    if (this.ttlSeconds === 0) return { value: await load(), status: "miss" };

    const hit = this.#store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return { value: hit.value as T, status: "hit" };
    }
    if (hit) this.#store.delete(key);

    // Someone else is already fetching this exact key — wait on their result.
    const pending = this.#inFlight.get(key);
    if (pending) return { value: (await pending) as T, status: "coalesced" };

    const promise = load()
      .then((value) => {
        this.#store.set(key, {
          value,
          expiresAt: Date.now() + this.ttlSeconds * 1000,
        });
        return value;
      })
      .finally(() => {
        this.#inFlight.delete(key);
      });

    this.#inFlight.set(key, promise);
    return { value: await promise, status: "miss" };
  }

  /** Drop expired entries. Call periodically so the Map doesn't grow forever. */
  prune(): void {
    const now = Date.now();
    for (const [key, entry] of this.#store) {
      if (entry.expiresAt <= now) this.#store.delete(key);
    }
  }

  get size(): number {
    return this.#store.size;
  }
}
