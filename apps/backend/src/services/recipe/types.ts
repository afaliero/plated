import type {
  RecipeDetail,
  RecipeSummary,
  SuggestRequest,
} from "@plated/shared";

/** Stable contract consumed by the backend orchestrator. */
export interface RecipeServiceContract {
  suggest(
    request: SuggestRequest,
    options?: { cache?: boolean },
  ): Promise<RecipeSummary[]>;
  detail(id: string): Promise<RecipeDetail | null>;
}
