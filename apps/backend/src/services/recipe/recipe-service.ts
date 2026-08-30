import type { IngredientRef } from "@plated/shared";
import type { TtlCache } from "src/storage/cache.js";
import { cacheKey, logCacheAccess } from "src/storage/util.js";
import type { RecipeClient } from "src/services/recipe/client/recipe-client.js";
import type { ClientIngredient } from "src/services/recipe/client/types.js";
import type { RecipeServiceContract } from "src/services/recipe/types.js";

function toIngredientRef(raw: ClientIngredient): IngredientRef {
  const amount =
    raw.original ??
    (raw.amount !== null ? `${raw.amount} ${raw.unit ?? ""}`.trim() : null);

  return {
    name: raw.name ?? raw.original ?? "unknown",
    amount: amount && amount.length > 0 ? amount : null,
    imageUrl: raw.imageUrl,
  };
}

export class RecipeService implements RecipeServiceContract {
  constructor(
    private readonly client: RecipeClient,
    private readonly cache: TtlCache,
  ) {}

  async suggest(request: Parameters<RecipeServiceContract["suggest"]>[0]) {
    const startedAt = Date.now();
    const key = cacheKey(request.ingredients);
    const { value, status } = await this.cache.getOrSet(key, () =>
      this.client.suggest(request),
    );
    logCacheAccess("suggest", status, key, startedAt);

    return value.map((recipe) => ({
      id: recipe.id,
      title: recipe.title,
      imageUrl: recipe.imageUrl,
      usedIngredients: recipe.usedIngredients.map(toIngredientRef),
      missedIngredients: recipe.missedIngredients.map(toIngredientRef),
      usedCount: recipe.usedIngredientCount,
      missedCount: recipe.missedIngredientCount,
      likes: recipe.likes,
    }));
  }

  async detail(id: string) {
    const startedAt = Date.now();
    const key = `detail:${id}`;
    const { value, status } = await this.cache.getOrSet(key, () =>
      this.client.detail(id),
    );
    logCacheAccess("detail", status, `id=${id}`, startedAt);

    if (!value) return null;
    return {
      id: value.id,
      title: value.title,
      imageUrl: value.imageUrl,
      readyInMinutes: value.readyInMinutes,
      servings: value.servings,
      sourceUrl: value.sourceUrl,
      sourceName: value.sourceName,
      ingredients: value.ingredients.map(toIngredientRef),
      instructions: value.instructions,
    };
  }
}
