import { Hono } from "hono";
import {
  SuggestRequestSchema,
  suggestCacheKey,
  normalizeIngredients,
  type RecipeDetailResponse,
  type SuggestResponse,
} from "@plated/shared";
import { badRequest, notFound } from "../lib/errors.js";
import type { TtlCache } from "../lib/cache.js";
import type { RecipeSource } from "../sources/types.js";

export function recipesRouter(source: RecipeSource, cache: TtlCache): Hono {
  const router = new Hono();

  /**
   * POST /recipes/suggest
   * Ingredients in, recipe cards out. POST rather than GET because the
   * ingredient list can be long and we want it in a body, not a URL.
   */
  router.post("/suggest", async (c) => {
    const body = await c.req.json().catch(() => {
      throw badRequest("Request body must be valid JSON.");
    });

    const parsed = SuggestRequestSchema.safeParse(body);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
        .join("; ");
      throw badRequest(detail);
    }

    // Normalize before both the cache key and the upstream call so that
    // ["Rice","chicken "] and ["chicken","rice"] are one cache entry.
    const request = {
      ...parsed.data,
      ingredients: normalizeIngredients(parsed.data.ingredients),
    };
    if (request.ingredients.length === 0) {
      throw badRequest("Add at least one ingredient.");
    }

    const recipes = await cache.getOrSet(suggestCacheKey(request), () =>
      source.suggest(request),
    );

    return c.json<SuggestResponse>({ recipes });
  });

  /**
   * GET /recipes/:id
   * Full detail for one recipe. This is a SECOND upstream call — the suggest
   * endpoint deliberately returns no instructions, so only pay for this when
   * the user actually taps into a recipe.
   */
  router.get("/:id", async (c) => {
    const id = c.req.param("id");
    if (!/^[\w-]{1,64}$/.test(id)) throw badRequest("Malformed recipe id.");

    const recipe = await cache.getOrSet(`detail:${id}`, () =>
      source.detail(id),
    );
    if (!recipe) throw notFound(`No recipe with id ${id}.`);

    return c.json<RecipeDetailResponse>({ recipe });
  });

  return router;
}
