import type { AddFridgeItemRequest, SuggestRequest } from "@plated/shared";
import type { FridgeServiceContract } from "src/services/fridge/types.js";
import type { PreferenceRankerContract } from "src/services/recipe/preference-ranker.js";
import { badRequest } from "src/lib/errors.js";
import type { RecipeServiceContract } from "src/services/recipe/types.js";
import { normalizeIngredients } from "src/routes/util.js";

/** Coordinates HTTP-facing use cases across internal services. */
export class Orchestrator {
  constructor(
    private readonly recipes: RecipeServiceContract,
    private readonly fridge: FridgeServiceContract,
    private readonly ranker?: PreferenceRankerContract,
  ) {}

  getFridge(userId: number) {
    return this.fridge.list(userId);
  }

  addFridgeItem(userId: number, input: AddFridgeItemRequest) {
    return this.fridge.add(userId, input);
  }

  removeFridgeItem(userId: number, ingredientId: number) {
    return this.fridge.remove(userId, ingredientId);
  }

  async suggestFridgeRecipes(userId: number, request: SuggestRequest) {
    const items = await this.fridge.list(userId);
    if (items.length === 0) return [];
    const candidates = await this.recipes.suggest(
      {
        ...request,
        ingredients: items.map((item) => item.name),
      },
      { cache: !request.preferences },
    );
    if (!request.preferences) return candidates;
    if (!this.ranker) throw new Error("Preference ranking is not configured.");
    let rankedIds: string[];
    try {
      rankedIds = await this.ranker.rank(candidates, request.preferences);
    } catch (error) {
      console.error(
        "Preference ranking failed; returning unranked recipes.",
        error,
      );
      return candidates;
    }
    const byId = new Map(candidates.map((recipe) => [recipe.id, recipe]));
    return rankedIds.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  }

  async suggestRecipes(request: SuggestRequest) {
    const ingredients = normalizeIngredients(request.ingredients);
    if (ingredients.length === 0) {
      throw badRequest("Add at least one ingredient.");
    }

    return this.recipes.suggest({ ...request, ingredients });
  }

  getRecipe(id: string) {
    return this.recipes.detail(id);
  }
}
