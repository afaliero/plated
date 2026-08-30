export type Miss = { readonly query: string; readonly at: number };

const MAX_MISSES = 200;
const misses: Miss[] = [];
let sink: ((miss: Miss) => void) | null = null;

/**
 * Record a search that found nothing AND that the user still committed to.
 *
 * Deliberately not called from searchIngredients — that fires on every
 * keystroke, so "chic" would be logged as a miss on the way to "chicken".
 * Call this when the user actually adds the unmatched text, which is the only
 * signal that the gap mattered to them.
 */
export function recordMiss(query: string): void {
  const cleaned = query.trim().toLowerCase();
  if (!cleaned) return;

  const miss: Miss = { query: cleaned, at: Date.now() };
  misses.push(miss);
  if (misses.length > MAX_MISSES) misses.shift();
  sink?.(miss);
}

/** Point this at the API once there's an endpoint to receive misses. */
export function setMissSink(fn: ((miss: Miss) => void) | null): void {
  sink = fn;
}

export function drainMisses(): Miss[] {
  return misses.splice(0, misses.length);
}
