import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { ApiError } from "@plated/shared";
import { env } from "src/env.js";
import { TtlCache } from "src/storage/cache.js";
import { AppError } from "src/lib/errors.js";
import { recipesRouter } from "src/routes/recipes.js";
import { SpoonacularSource } from "src/sources/spoonacular.js";

const cache = new TtlCache(env.CACHE_TTL_SECONDS);
const source = new SpoonacularSource(env.SPOONACULAR_API_KEY);

// Keep the cache from growing unbounded across a long-running process.
setInterval(() => cache.prune(), 60_000).unref();

const app = new Hono();

app.use("*", logger());
// Wide open for local development — an Expo app on a phone hits this over the
// LAN. Lock this down to your real origins before you ship anything public.
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok", cacheEntries: cache.size }));

app.route("/recipes", recipesRouter(source, cache));

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
  console.log(`plated api listening on http://localhost:${port}`);
});
