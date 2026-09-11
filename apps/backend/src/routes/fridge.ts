import { Hono } from "hono";
import { z } from "zod";
import {
  AddFridgeItemRequestSchema,
  type FridgeResponse,
  type SuggestResponse,
} from "@plated/shared";
import { badRequest } from "src/lib/errors.js";
import type { Orchestrator } from "src/routes/orchestrator.js";

// Local development only; replace with authenticated identity before hosting.
const DEVELOPMENT_USER_ID = 1;

export function fridgeRouter(orchestrator: Orchestrator): Hono {
  const router = new Hono();

  router.get("/", async (c) => {
    const items = await orchestrator.getFridge(DEVELOPMENT_USER_ID);
    return c.json<FridgeResponse>({ items });
  });

  router.post("/items", async (c) => {
    const body = await c.req.json().catch(() => {
      throw badRequest("Request body must be valid JSON.");
    });
    const parsed = AddFridgeItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw badRequest(
        parsed.error.issues.map((issue) => issue.message).join("; "),
      );
    }

    const items = await orchestrator.addFridgeItem(
      DEVELOPMENT_USER_ID,
      parsed.data,
    );
    return c.json<FridgeResponse>({ items });
  });

  router.delete("/items/:ingredientId", async (c) => {
    const rawId = c.req.param("ingredientId");
    const ingredientId = Number(rawId);
    if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(ingredientId)) {
      throw badRequest("Malformed ingredient id.");
    }

    const items = await orchestrator.removeFridgeItem(
      DEVELOPMENT_USER_ID,
      ingredientId,
    );
    return c.json<FridgeResponse>({ items });
  });

  router.get("/recipes", async (c) => {
    const parsed = z
      .object({
        limit: z.coerce.number().int().min(1).max(20).default(10),
        ranking: z
          .enum(["maximize-used", "minimize-missing"])
          .default("minimize-missing"),
        ignorePantry: z.coerce.boolean().default(true),
      })
      .safeParse({
        limit: c.req.query("limit"),
        ranking: c.req.query("ranking"),
        ignorePantry: c.req.query("ignorePantry"),
      });
    if (!parsed.success) throw badRequest("Invalid recipe suggestion options.");
    const recipes = await orchestrator.suggestFridgeRecipes(
      DEVELOPMENT_USER_ID,
      { ingredients: ["placeholder"], ...parsed.data },
    );
    return c.json<SuggestResponse>({ recipes });
  });

  return router;
}
