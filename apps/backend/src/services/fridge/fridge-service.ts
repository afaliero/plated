import type { AddFridgeItemRequest } from "@plated/shared";
import type {
  FridgeRepositoryContract,
  FridgeServiceContract,
} from "./types.js";

export class FridgeService implements FridgeServiceContract {
  constructor(private readonly repository: FridgeRepositoryContract) {}

  list(userId: number) {
    return this.repository.list(userId);
  }

  async add(userId: number, input: AddFridgeItemRequest) {
    await this.repository.add(userId, input.name);
    return this.list(userId);
  }

  async remove(userId: number, ingredientId: number) {
    await this.repository.remove(userId, ingredientId);
    return this.list(userId);
  }
}
