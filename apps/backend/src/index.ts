import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { ApiError } from "@plated/shared";
import { env } from "src/env.js";
import { AppError } from "src/lib/errors.js";
import { Orchestrator } from "src/routes/orchestrator.js";
import { recipesRouter } from "src/routes/recipes.js";
import { RecipeClient } from "src/services/recipe/client/recipe-client.js";
import { SpoonacularClient } from "src/services/recipe/client/spoonacular/spoonacular-client.js";
import { spoonacularConfig } from "src/services/recipe/client/spoonacular/config.js";
import { RecipeService } from "src/services/recipe/recipe-service.js";
import { recipeCache } from "src/services/recipe/storage/cache.js";
import { initializeDatabase } from "src/storage/db/knex.js";

const spoonacularClient = new SpoonacularClient(spoonacularConfig);
const recipeClient = new RecipeClient(spoonacularClient);
const recipeService = new RecipeService(recipeClient, recipeCache);
const orchestrator = new Orchestrator(recipeService);

await initializeDatabase();

// Keep the cache from growing unbounded across a long-running process.
setInterval(() => recipeCache.prune(), 60_000).unref();

const app = new Hono();

app.use("*", logger());
// Wide open for local development — an Expo app on a phone hits this over the
// LAN. Lock this down to your real origins before you ship anything public.
app.use("*", cors());

app.get("/health", (c) =>
  c.json({ status: "ok", cacheEntries: recipeCache.size }),
);

app.route("/recipes", recipesRouter(orchestrator));

app.notFound((c) =>
  c.json<ApiError>(
    { error: { code: "not_found", message: "No such endpoint." } },
    404,
  ),
);

app.onError((err, c) => {
  if (err instanceof AppError) {
    if (err.cause) console.error(`[${err.code}]`, err.message, err.cause);
    return c.json<ApiError>(
      { error: { code: err.code, message: err.message } },
      err.status as 400,
    );
  }

  console.error("Unhandled error:", err);
  return c.json<ApiError>(
    { error: { code: "internal_error", message: "Something went wrong." } },
    500,
  );
});

serve({ fetch: app.fetch, port: env.PORT }, ({ port }) => {
  console.log(`plated backend listening on http://localhost:${port}`);
});
