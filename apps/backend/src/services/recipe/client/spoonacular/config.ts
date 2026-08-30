import { z } from "zod";

const MAX_CACHE_TTL_SECONDS = 3600;

const SpoonacularConfigSchema = z.object({
  SPOONACULAR_API_KEY: z.string().min(1, "SPOONACULAR_API_KEY is required"),
  SPOONACULAR_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  SPOONACULAR_CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(MAX_CACHE_TTL_SECONDS)
    .default(900),
});

const parsed = SpoonacularConfigSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid Spoonacular configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const spoonacularConfig = {
  apiKey: parsed.data.SPOONACULAR_API_KEY,
  timeoutMs: parsed.data.SPOONACULAR_TIMEOUT_MS,
  cacheTtlSeconds: parsed.data.SPOONACULAR_CACHE_TTL_SECONDS,
};

export type SpoonacularConfig = typeof spoonacularConfig;
