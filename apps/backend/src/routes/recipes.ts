import { Hono } from "hono";
import {
  SuggestRequestSchema,
  type RecipeDetailResponse,
  type SuggestResponse,
} from "@plated/shared";
import { badRequest, notFound } from "src/lib/errors.js";
import type { Orchestrator } from "src/routes/orchestrator.js";

export function recipesRouter(orchestrator: Orchestrator): Hono {
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

    const recipes = await orchestrator.suggestRecipes(parsed.data);

    return c.json<SuggestResponse>({ recipes });
  });

  router.get("/:id", async (c) => {
    const id = c.req.param("id");
    if (!/^[\w-]{1,64}$/.test(id)) throw badRequest("Malformed recipe id.");

    const recipe = await orchestrator.getRecipe(id);

    if (!recipe) throw notFound(`No recipe with id ${id}.`);

    return c.json<RecipeDetailResponse>({ recipe });
  });

  return router;
}
