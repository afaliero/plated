import {
  ApiErrorSchema,
  RecipeDetailResponseSchema,
  SuggestResponseSchema,
  normalizeIngredients,
  type RecipeDetail,
  type RecipeSummary,
  type SuggestRequestInput,
} from "@plated/shared";

/**
 * `EXPO_PUBLIC_` vars are inlined into the bundle at build time.
 *
 * localhost works in the iOS simulator. On a PHYSICAL device it will not —
 * the phone resolves localhost to itself. Set your machine's LAN address in
 * apps/mobile/.env:
 *   EXPO_PUBLIC_API_URL=http://192.168.1.42:3000
 *
 * Never put the Spoonacular key here. Anything EXPO_PUBLIC_ ships inside the
 * app bundle and is trivially readable by anyone who downloads it.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch (cause) {
    throw new ApiRequestError(
      "Can't reach the server. Check your connection.",
      "network_error",
      0,
    );
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = ApiErrorSchema.safeParse(body);
    throw new ApiRequestError(
      parsed.success ? parsed.data.error.message : "Something went wrong.",
      parsed.success ? parsed.data.error.code : "internal_error",
      response.status,
    );
  }

  return body;
}

/** Ingredients in, recipe cards out. */
export async function suggestRecipes(
  input: SuggestRequestInput,
): Promise<RecipeSummary[]> {
  // Normalize client-side too: identical queries then hit the same server-side
  // cache entry instead of each burning upstream quota.
  const body = {
    ...input,
    ingredients: normalizeIngredients(input.ingredients),
  };

  const raw = await request("/recipes/suggest", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return SuggestResponseSchema.parse(raw).recipes;
}

/** Full recipe for the detail screen. Costs a second upstream call. */
export async function getRecipe(id: string): Promise<RecipeDetail> {
  const raw = await request(`/recipes/${encodeURIComponent(id)}`);
  return RecipeDetailResponseSchema.parse(raw).recipe;
}
