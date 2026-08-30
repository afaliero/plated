import { ApiClient, RecipesApi, type SpoonacularCallback } from "spoonacular";
import { z } from "zod";
import {
  AppError,
  notFound,
  quotaExceeded,
  upstreamError,
} from "src/lib/errors.js";
import type { SpoonacularConfig } from "src/services/recipe/client/spoonacular/config.js";
import type {
  ClientIngredient,
  RecipeClientRequest,
  RecipeVendorClient,
} from "src/services/recipe/client/types.js";

const INGREDIENT_IMAGE_BASE = "https://img.spoonacular.com/ingredients_100x100";

const IngredientSchema = z.object({
  name: z.string().optional(),
  original: z.string().optional(),
  amount: z.number().optional(),
  unit: z.string().optional(),
  image: z.string().nullish(),
});
type SpoonacularIngredient = z.infer<typeof IngredientSchema>;

const SuggestResponseSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    image: z.string().nullish(),
    likes: z.number().default(0),
    usedIngredientCount: z.number().default(0),
    missedIngredientCount: z.number().default(0),
    usedIngredients: z.array(IngredientSchema).default([]),
    missedIngredients: z.array(IngredientSchema).default([]),
  }),
);

const DetailResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  image: z.string().nullish(),
  readyInMinutes: z.number().nullish(),
  servings: z.number().nullish(),
  sourceUrl: z.string().nullish(),
  sourceName: z.string().nullish(),
  instructions: z.string().nullish(),
  extendedIngredients: z.array(IngredientSchema).default([]),
  analyzedInstructions: z
    .array(
      z.object({ steps: z.array(z.object({ step: z.string() })).default([]) }),
    )
    .default([]),
});

function toClientIngredient(raw: SpoonacularIngredient): ClientIngredient {
  return {
    name: raw.name ?? null,
    original: raw.original ?? null,
    amount: raw.amount ?? null,
    unit: raw.unit ?? null,
    imageUrl: raw.image ? `${INGREDIENT_IMAGE_BASE}/${raw.image}` : null,
  };
}

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

export class SpoonacularClient implements RecipeVendorClient {
  readonly #recipes: RecipesApi;

  constructor(config: SpoonacularConfig) {
    const client = new ApiClient();
    client.authentications.apiKeyScheme.apiKey = config.apiKey;
    client.timeout = config.timeoutMs;
    this.#recipes = new RecipesApi(client);
  }

  #call(invoke: (callback: SpoonacularCallback) => unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      try {
        invoke((error, data) => {
          if (error) reject(toAppError(error));
          else resolve(data);
        });
      } catch (cause) {
        reject(
          upstreamError("Malformed request to the recipe service.", cause),
        );
      }
    });
  }

  async suggest(request: RecipeClientRequest) {
    const raw = await this.#call((callback) =>
      this.#recipes.searchRecipesByIngredients(
        request.ingredients.join(","),
        {
          number: request.limit,
          ranking: request.ranking === "maximize-used" ? 1 : 2,
          ignorePantry: request.ignorePantry,
        },
        callback,
      ),
    );
    const parsed = SuggestResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw upstreamError(
        "Unexpected response shape from the recipe service.",
        parsed.error,
      );
    }

    return parsed.data.map((recipe) => ({
      id: String(recipe.id),
      title: recipe.title,
      imageUrl: recipe.image ?? null,
      likes: recipe.likes,
      usedIngredientCount: recipe.usedIngredientCount,
      missedIngredientCount: recipe.missedIngredientCount,
      usedIngredients: recipe.usedIngredients.map(toClientIngredient),
      missedIngredients: recipe.missedIngredients.map(toClientIngredient),
    }));
  }

  async detail(id: string) {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) return null;

    let raw: unknown;
    try {
      raw = await this.#call((callback) =>
        this.#recipes.getRecipeInformation(
          numericId,
          { includeNutrition: false },
          callback,
        ),
      );
    } catch (error) {
      if (error instanceof AppError && error.code === "not_found") return null;
      throw error;
    }

    const parsed = DetailResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw upstreamError(
        "Unexpected response shape from the recipe service.",
        parsed.error,
      );
    }
    const recipe = parsed.data;
    const stepped = recipe.analyzedInstructions.flatMap((group) =>
      group.steps.map(({ step }) => step.trim()).filter(Boolean),
    );
    const fallback = recipe.instructions ? stripHtml(recipe.instructions) : "";

    return {
      id: String(recipe.id),
      title: recipe.title,
      imageUrl: recipe.image ?? null,
      readyInMinutes: recipe.readyInMinutes ?? null,
      servings: recipe.servings ?? null,
      sourceUrl: recipe.sourceUrl ?? null,
      sourceName: recipe.sourceName ?? null,
      ingredients: recipe.extendedIngredients.map(toClientIngredient),
      instructions: stepped.length > 0 ? stepped : fallback ? [fallback] : [],
    };
  }
}
