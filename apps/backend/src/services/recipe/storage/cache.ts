import { spoonacularConfig } from "src/services/recipe/client/spoonacular/config.js";
import { TtlCache } from "src/storage/cache.js";

/** Recipe-owned cache instance; the generic implementation stays shared. */
export const recipeCache = new TtlCache(spoonacularConfig.cacheTtlSeconds);
