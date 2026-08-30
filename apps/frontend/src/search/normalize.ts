const DIACRITICS: Record<string, string> = {
  à: "a",
  á: "a",
  â: "a",
  ä: "a",
  ã: "a",
  å: "a",
  ç: "c",
  è: "e",
  é: "e",
  ê: "e",
  ë: "e",
  ì: "i",
  í: "i",
  î: "i",
  ï: "i",
  ñ: "n",
  ò: "o",
  ó: "o",
  ô: "o",
  ö: "o",
  õ: "o",
  ù: "u",
  ú: "u",
  û: "u",
  ü: "u",
  ý: "y",
  ÿ: "y",
};

// Deliberately conservative. Words like "ground", "dried" and "smoked" stay:
// "ground beef" is not "beef", and collapsing them would merge distinct entries.
const NOISE = new Set([
  "fresh",
  "freshly",
  "ripe",
  "organic",
  "large",
  "small",
  "medium",
  "chopped",
  "diced",
  "sliced",
  "peeled",
  "seeded",
  "pitted",
  "boneless",
  "skinless",
  "of",
  "a",
  "an",
  "the",
]);

// Words where stripping a trailing "s" produces a non-word.
const INVARIANT = new Set([
  "molasses",
  "asparagus",
  "hummus",
  "couscous",
  "watercress",
  "cress",
  "grass",
  "bass",
  "swiss",
  "brussels",
  "anise",
  "greens",
]);

function stripDiacritics(value: string): string {
  let out = "";
  for (const char of value) out += DIACRITICS[char] ?? char;
  return out;
}

const IRREGULAR: Record<string, string> = {
  leaves: "leaf",
  loaves: "loaf",
  halves: "half",
  knives: "knife",
};

function singularize(word: string): string {
  const irregular = IRREGULAR[word];
  if (irregular) return irregular;
  if (word.length <= 3 || INVARIANT.has(word)) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  // Must precede the generic rules: "tomatoes" is "tomato", not "tomatoe".
  if (word.endsWith("oes")) return word.slice(0, -2);
  if (/(s|sh|ch|x|z)es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

/**
 * Shared by queries and by the haystack at build time — both sides must run
 * through this or they can't match.
 */
export function normalize(raw: string): string {
  const cleaned = stripDiacritics(raw.toLowerCase())
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  const tokens = cleaned.split(" ").filter((t) => !/^\d+$/.test(t));
  const kept = tokens.filter((t) => !NOISE.has(t));
  const words = kept.length > 0 ? kept : tokens;

  if (words.length === 0) return "";

  const last = words.length - 1;
  words[last] = singularize(words[last]!);
  return words.join(" ");
}
