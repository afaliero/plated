import { ApiClient, RecipesApi, type SpoonacularCallback } from "spoonacular";
import { z } from "zod";
import type {
  IngredientRef,
  RecipeDetail,
  RecipeSummary,
  SuggestRequest,
} from "@plated/shared";
import {
  AppError,
  notFound,
  quotaExceeded,
  upstreamError,
} from "@/lib/errors.js";
import type { RecipeSource } from "@/sources/types.js";

/** Spoonacular returns ingredient `image` as a bare filename, not a URL. */
const INGREDIENT_IMAGE_BASE = "https://img.spoonacular.com/ingredients_100x100";

/* ------------------------------------------------------------------ *
 * Response validation
 *
 * The SDK deserializes into generated model objects that are themselves
 * untyped, so zod remains the real type boundary. Validating here means an
 * upstream shape change fails loudly at the edge instead of surfacing as
 * `undefined` somewhere in the mobile app.
 * ------------------------------------------------------------------ */

const UpstreamIngredientSchema = z.object({
  name: z.string().optional(),
  original: z.string().optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  image: z.string().nullish(),
});
type UpstreamIngredient = z.infer<typeof UpstreamIngredientSchema>;

const FindByIngredientsSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    image: z.string().nullish(),
    likes: z.number().default(0),
    usedIngredientCount: z.number().default(0),
    missedIngredientCount: z.number().default(0),
    usedIngredients: z.array(UpstreamIngredientSchema).default([]),
    missedIngredients: z.array(UpstreamIngredientSchema).default([]),
  }),
);

const RecipeInformationSchema = z.object({
  id: z.number(),
  title: z.string(),
  image: z.string().nullish(),
  readyInMinutes: z.number().nullish(),
  servings: z.number().nullish(),
  sourceUrl: z.string().nullish(),
  sourceName: z.string().nullish(),
  instructions: z.string().nullish(),
  extendedIngredients: z.array(UpstreamIngredientSchema).default([]),
  analyzedInstructions: z
    .array(
      z.object({ steps: z.array(z.object({ step: z.string() })).default([]) }),
    )
    .default([]),
});

/* ------------------------------------------------------------------ *
 * Mapping helpers
 * ------------------------------------------------------------------ */

function toIngredientRef(raw: UpstreamIngredient): IngredientRef {
  const amount =
    raw.original ??
    (raw.amount !== undefined
      ? `${raw.amount} ${raw.unit ?? ""}`.trim()
      : null);

  return {
    name: raw.name ?? raw.original ?? "unknown",
    amount: amount && amount.length > 0 ? amount : null,
    imageUrl: raw.image ? `${INGREDIENT_IMAGE_BASE}/${raw.image}` : null,
  };
}

/** Strip HTML tags and decode the handful of entities Spoonacular emits. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

/** `ranking` is Spoonacular's magic number: 1 = max used, 2 = min missing. */
function toRankingParam(ranking: SuggestRequest["ranking"]): number {
  return ranking === "maximize-used" ? 1 : 2;
}

/** Map an SDK/superagent error onto our typed AppError taxonomy. */
function toAppError(error: Error & { status?: number }): AppError {
  switch (error.status) {
    case 402:
      return quotaExceeded(error);
    case 401:
    case 403:
      return upstreamError("Recipe service rejected the API key.", error);
    case 404:
      return notFound("Recipe not found.");
    default:
      return upstreamError("Recipe service request failed.", error);
  }
}

/* ------------------------------------------------------------------ *
 * Client
 * ------------------------------------------------------------------ */

export class SpoonacularSource implements RecipeSource {
  readonly #recipes: RecipesApi;

  constructor(apiKey: string) {
    // Build a dedicated ApiClient rather than mutating the ApiClient.instance
    // singleton — that keeps the key out of shared global state and makes a
    // second client (tests, a different key) possible later.
    const client = new ApiClient();
    client.authentications.apiKeyScheme.apiKey = apiKey;
    client.timeout = 10_000;
    this.#recipes = new RecipesApi(client);
  }

  /**
   * The SDK is callback-only — `callApi` returns a raw superagent request and
   * never a promise — so every call goes through this adapter.
   */
  #call(invoke: (callback: SpoonacularCallback) => unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      try {
        invoke((error, data) => {
          if (error) reject(toAppError(error));
          else resolve(data);
        });
      } catch (cause) {
        // The SDK throws synchronously on missing required params.
        reject(
          upstreamError("Malformed request to the recipe service.", cause),
        );
      }
    });
  }

  async suggest(request: SuggestRequest): Promise<RecipeSummary[]> {
    const raw = await this.#call((cb) =>
      this.#recipes.searchRecipesByIngredients(
        request.ingredients.join(","),
        {
          number: request.limit,
          ranking: toRankingParam(request.ranking),
          ignorePantry: request.ignorePantry,
        },
        cb,
      ),
    );

    const parsed = FindByIngredientsSchema.safeParse(raw);
    if (!parsed.success) {
      throw upstreamError(
        "Unexpected response shape from the recipe service.",
        parsed.error,
      );
    }

    return parsed.data.map((item) => ({
      id: String(item.id),
      title: item.title,
      imageUrl: item.image ?? null,
      usedIngredients: item.usedIngredients.map(toIngredientRef),
      missedIngredients: item.missedIngredients.map(toIngredientRef),
      usedCount: item.usedIngredientCount,
      missedCount: item.missedIngredientCount,
      likes: item.likes,
    }));
  }

  async detail(id: string): Promise<RecipeDetail | null> {
    // The SDK's getRecipeInformation takes a number, but our vendor-neutral
    // contract uses string ids — so this is where that translation happens.
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return null;

    let raw: unknown;
    try {
      raw = await this.#call((cb) =>
        this.#recipes.getRecipeInformation(
          numericId,
          { includeNutrition: false },
          cb,
        ),
      );
    } catch (error) {
      // "No such recipe" is a null return, not an error the route should throw.
      if (error instanceof AppError && error.code === "not_found") return null;
      throw error;
    }

    const parsed = RecipeInformationSchema.safeParse(raw);
    if (!parsed.success) {
      throw upstreamError(
        "Unexpected response shape from the recipe service.",
        parsed.error,
      );
    }
    const info = parsed.data;

    const stepped = info.analyzedInstructions.flatMap((group) =>
      group.steps.map((s) => s.step.trim()).filter((s) => s.length > 0),
    );
    const fallback = info.instructions ? stripHtml(info.instructions) : "";
    const instructions =
      stepped.length > 0 ? stepped : fallback ? [fallback] : [];

    return {
      id: String(info.id),
      title: info.title,
      imageUrl: info.image ?? null,
      readyInMinutes: info.readyInMinutes ?? null,
      servings: info.servings ?? null,
      sourceUrl: info.sourceUrl ?? null,
      sourceName: info.sourceName ?? null,
      ingredients: info.extendedIngredients.map(toIngredientRef),
      instructions,
    };
  }
}
