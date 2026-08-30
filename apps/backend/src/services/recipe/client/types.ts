export interface ClientIngredient {
  name: string | null;
  original: string | null;
  amount: number | null;
  unit: string | null;
  imageUrl: string | null;
}

export interface ClientRecipeSummary {
  id: string;
  title: string;
  imageUrl: string | null;
  likes: number;
  usedIngredientCount: number;
  missedIngredientCount: number;
  usedIngredients: ClientIngredient[];
  missedIngredients: ClientIngredient[];
}

export interface ClientRecipeDetail {
  id: string;
  title: string;
  imageUrl: string | null;
  readyInMinutes: number | null;
  servings: number | null;
  sourceUrl: string | null;
  sourceName: string | null;
  ingredients: ClientIngredient[];
  instructions: string[];
}

export interface RecipeClientRequest {
  ingredients: string[];
  limit: number;
  ranking: "maximize-used" | "minimize-missing";
  ignorePantry: boolean;
}

/** Contract implemented by any recipe vendor adapter. */
export interface RecipeVendorClient {
  suggest(request: RecipeClientRequest): Promise<ClientRecipeSummary[]>;
  detail(id: string): Promise<ClientRecipeDetail | null>;
}
