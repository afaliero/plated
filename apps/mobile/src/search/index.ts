import uFuzzy from "@leeoniya/ufuzzy";
import { doubleMetaphone } from "double-metaphone";
import { INGREDIENTS, type Ingredient } from "./ingredients";
import { normalize } from "./normalize";

export type { Ingredient } from "./ingredients";
export { recordMiss, setMissSink, drainMisses, type Miss } from "./misses";

export type MatchSource = "fuzzy" | "phonetic";

export type SearchResult = {
  readonly ingredient: Ingredient;
  /** The name or alias that actually matched — show it when it isn't the name. */
  readonly matchedOn: string;
  readonly via: MatchSource;
};

export type SearchOutcome =
  | { readonly type: "empty" }
  | {
      readonly type: "results";
      /** May be empty. */
      readonly results: readonly SearchResult[];
      /** Always available — a weak match shouldn't block adding what was typed. */
      readonly addAsTyped: string;
      /** True when the query is literally an indexed name or alias. */
      readonly hasExact: boolean;
    };

// SingleError mode: one insertion, substitution, transposition or deletion per
// term. Enough for "chikcn", not so loose that "oat" matches "goat cheese".
const uf = new uFuzzy({
  intraMode: 1,
  intraIns: 1,
  intraSub: 1,
  intraTrn: 1,
  intraDel: 1,
});

const haystack: string[] = [];
const display: string[] = [];
const owners: number[] = [];

for (let i = 0; i < INGREDIENTS.length; i++) {
  const ingredient = INGREDIENTS[i]!;
  haystack.push(normalize(ingredient.name));
  display.push(ingredient.name);
  owners.push(i);

  for (const alias of ingredient.aliases ?? []) {
    haystack.push(normalize(alias));
    display.push(alias);
    owners.push(i);
  }
}

// Lowercased because uFuzzy's default intraSplit treats a lower→upper
// transition as a term boundary, which would shred raw metaphone codes.
function phoneticKey(value: string): string {
  return value
    .split(" ")
    .map((word) => doubleMetaphone(word)[0].toLowerCase())
    .join(" ");
}

const phonetic = haystack.map(phoneticKey);

const exact = new Map<string, number[]>();
for (let i = 0; i < haystack.length; i++) {
  const key = haystack[i]!;
  const bucket = exact.get(key);
  if (bucket) bucket.push(i);
  else exact.set(key, [i]);
}

function collect(
  hits: readonly number[],
  via: MatchSource,
  limit: number,
): SearchResult[] {
  const seen = new Set<number>();
  const results: SearchResult[] = [];

  for (const hit of hits) {
    const owner = owners[hit]!;
    if (seen.has(owner)) continue;
    seen.add(owner);
    results.push({
      ingredient: INGREDIENTS[owner]!,
      matchedOn: display[hit]!,
      via,
    });
    if (results.length >= limit) break;
  }

  return results;
}

function rank(pool: string[], needle: string): number[] {
  const [idxs, info, order] = uf.search(pool, needle, 0, 1e3);
  return info && order ? order.map((o) => info.idx[o]!) : (idxs ?? []);
}

function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length === b.length) {
      i++;
      j++;
    } else if (a.length > b.length) i++;
    else j++;
  }

  return edits + (a.length - i) + (b.length - j) <= 1;
}

const codeLength = (code: string) => code.replace(/\s/g, "").length;

/**
 * An identical code is a strong signal at any length — "quinoa" and "kwinoa"
 * are both "kn". A one-edit code is only meaningful once it's long enough that
 * the edit isn't most of the word, or "xyzzy" ("ss") drags in half the list.
 */
const MIN_EXACT_LENGTH = 2;
const MIN_NEAR_LENGTH = 4;

/**
 * Metaphone drops vowels, so short codes collide freely — "seaweed" and
 * "swede" are both "swt". Require the two words to be close in length as well
 * as in sound. Proportional, so multi-word queries aren't penalised.
 */
const MAX_LENGTH_DRIFT = 0.25;

function similarLength(a: string, b: string): boolean {
  const longer = Math.max(a.length, b.length);
  return (
    longer === 0 || Math.abs(a.length - b.length) / longer <= MAX_LENGTH_DRIFT
  );
}

function soundsLike(query: string, queryCode: string): number[] {
  const queryLength = codeLength(queryCode);
  if (queryLength < MIN_EXACT_LENGTH) return [];

  const identical: number[] = [];
  const near: number[] = [];

  for (let i = 0; i < phonetic.length; i++) {
    const code = phonetic[i]!;
    if (!similarLength(haystack[i]!, query)) continue;

    if (code === queryCode) {
      identical.push(i);
    } else if (
      queryLength >= MIN_NEAR_LENGTH &&
      codeLength(code) >= MIN_NEAR_LENGTH &&
      withinOneEdit(code, queryCode)
    ) {
      near.push(i);
    }
  }

  return [...identical, ...near];
}

export function searchIngredients(rawQuery: string, limit = 20): SearchOutcome {
  const addAsTyped = rawQuery.trim().replace(/\s+/g, " ");
  const query = normalize(rawQuery);
  if (!query) return { type: "empty" };

  // Exact hits lead. uFuzzy scores by match shape, not equality, so without
  // this an alias can outrank the entry the user literally typed.
  const exactHits = exact.get(query) ?? [];
  const hits = [...exactHits, ...rank(haystack, query)];

  let results = collect(hits, "fuzzy", limit);

  if (results.length === 0) {
    // One edit apart in code space, not equality: "chikcn" is xkkn and
    // "chicken" is xkn, so identical codes would miss a typo that sounds right.
    results = collect(soundsLike(query, phoneticKey(query)), "phonetic", limit);
  }

  return {
    type: "results",
    results,
    addAsTyped,
    hasExact: exactHits.length > 0,
  };
}
