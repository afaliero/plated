import type { AddFridgeItemRequest, FridgeItem } from "@plated/shared";

export interface FridgeRepositoryContract {
  list(userId: number): Promise<FridgeItem[]>;
  add(userId: number, name: string): Promise<void>;
  remove(userId: number, ingredientId: number): Promise<void>;
}

export interface FridgeServiceContract {
  list(userId: number): Promise<FridgeItem[]>;
  add(userId: number, input: AddFridgeItemRequest): Promise<FridgeItem[]>;
  remove(userId: number, ingredientId: number): Promise<FridgeItem[]>;
}
