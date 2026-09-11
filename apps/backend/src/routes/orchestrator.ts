import type { AddFridgeItemRequest, SuggestRequest } from "@plated/shared";
import type { FridgeServiceContract } from "src/services/fridge/types.js";
import { badRequest } from "src/lib/errors.js";
import type { RecipeServiceContract } from "src/services/recipe/types.js";
import { normalizeIngredients } from "src/routes/util.js";

/** Coordinates HTTP-facing use cases across internal services. */
export class Orchestrator {
  constructor(
    private readonly recipes: RecipeServiceContract,
    private readonly fridge: FridgeServiceContract,
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
    return this.suggestRecipes({
      ...request,
      ingredients: items.map((item) => item.name),
    });
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
