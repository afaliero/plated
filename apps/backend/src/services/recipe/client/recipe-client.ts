import type {
  RecipeClientRequest,
  RecipeVendorClient,
} from "src/services/recipe/client/types.js";

/** Vendor-neutral client used by RecipeService. */
export class RecipeClient {
  constructor(private readonly vendor: RecipeVendorClient) {}

  suggest(request: RecipeClientRequest) {
    return this.vendor.suggest(request);
  }

  detail(id: string) {
    return this.vendor.detail(id);
  }
}
