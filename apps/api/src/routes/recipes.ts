import { Hono } from "hono";
import {
  SuggestRequestSchema,
  type RecipeDetailResponse,
  type SuggestResponse,
} from "@plated/shared";
import { badRequest, notFound } from "src/lib/errors.js";
import { logCacheAccess, cacheKey } from "src/storage/util.js";
import type { TtlCache } from "src/storage/cache.js";
import type { RecipeSource } from "src/sources/types.js";
import { normalizeIngredients } from "src/routes/util.js";

export function recipesRouter(source: RecipeSource, cache: TtlCache): Hono {
  const router = new Hono();

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

    const ingredients = normalizeIngredients(parsed.data.ingredients);

    if (ingredients.length === 0) {
      throw badRequest("Add at least one ingredient.");
    }
    const request = {
      ...parsed.data,
      ingredients,
    };

    const startedAt = Date.now();
    const key = cacheKey(ingredients);
    const { value: recipes, status } = await cache.getOrSet(key, () =>
      source.suggest(request),
    );
    logCacheAccess("suggest", status, key, startedAt);

    return c.json<SuggestResponse>({ recipes });
  });

  router.get("/:id", async (c) => {
    const id = c.req.param("id");
    if (!/^[\w-]{1,64}$/.test(id)) throw badRequest("Malformed recipe id.");

    const startedAt = Date.now();
    const { value: recipe, status } = await cache.getOrSet(`detail:${id}`, () =>
      source.detail(id),
    );
    logCacheAccess("detail", status, `id=${id}`, startedAt);

    if (!recipe) throw notFound(`No recipe with id ${id}.`);

    return c.json<RecipeDetailResponse>({ recipe });
  });

  return router;
}
