import { z } from "zod";

/**
 * Spoonacular's terms permit caching their data for a maximum of 1 hour.
 * This ceiling is enforced in code so a stray .env value can't quietly put you
 * out of compliance. Re-read their ToS before touching it.
 */
const MAX_CACHE_TTL_SECONDS = 3600;

const EnvSchema = z.object({
  SPOONACULAR_API_KEY: z
    .string()
    .min(1, "SPOONACULAR_API_KEY is required — copy .env.example to apps/api/.env"),
  PORT: z.coerce.number().int().positive().default(3000),
  CACHE_TTL_SECONDS: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(MAX_CACHE_TTL_SECONDS)
    .default(900),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
