import type { SuggestRequest } from "@plated/shared";
import { badRequest } from "src/lib/errors.js";
import type { RecipeServiceContract } from "src/services/recipe/types.js";
import { normalizeIngredients } from "src/routes/util.js";

/** Coordinates HTTP-facing use cases across internal services. */
export class Orchestrator {
  constructor(private readonly recipes: RecipeServiceContract) {}

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
