import type {
  RecipeDetail,
  RecipeSummary,
  SuggestRequest,
} from "@plated/shared";

/** Stable contract consumed by the backend orchestrator. */
export interface RecipeServiceContract {
  suggest(request: SuggestRequest): Promise<RecipeSummary[]>;
  detail(id: string): Promise<RecipeDetail | null>;
}
