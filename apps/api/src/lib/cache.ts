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

export class TtlCache {
  readonly #store = new Map<string, Entry<unknown>>();
  readonly #inFlight = new Map<string, Promise<unknown>>();

  constructor(private readonly ttlSeconds: number) {}

  async getOrSet<T>(key: string, load: () => Promise<T>): Promise<T> {
    if (this.ttlSeconds === 0) return load();

    const hit = this.#store.get(key);
    if (hit && hit.expiresAt > Date.now()) {
      return hit.value as T;
    }
    if (hit) this.#store.delete(key);

    // Someone else is already fetching this exact key — wait on their result.
    const pending = this.#inFlight.get(key);
    if (pending) return pending as Promise<T>;

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
    return promise;
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
