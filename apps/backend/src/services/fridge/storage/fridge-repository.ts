import type { Knex } from "knex";
import type { FridgeItem } from "@plated/shared";
import type { FridgeRepositoryContract } from "src/services/fridge/types.js";

export class FridgeRepository implements FridgeRepositoryContract {
  constructor(private readonly db: Knex) {}

  async list(userId: number): Promise<FridgeItem[]> {
    return this.db("fridges")
      .join("ingredients", "ingredients.id", "fridges.ingredient_id")
      .where("fridges.user_id", userId)
      .select("ingredients.id", "ingredients.name")
      .orderBy("ingredients.name");
  }

  async add(userId: number, name: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx("ingredients")
        .insert({ name })
        .onConflict("name")
        .merge(["name"]);
      const ingredient = await trx<FridgeItem>("ingredients")
        .where({ name })
        .first();
      if (!ingredient) throw new Error("Ingredient was not saved.");

      await trx("fridges")
        .insert({ user_id: userId, ingredient_id: ingredient.id })
        .onConflict(["user_id", "ingredient_id"])
        .merge(["ingredient_id"]);
    });
  }

  async remove(userId: number, ingredientId: number): Promise<void> {
    await this.db("fridges")
      .where({ user_id: userId, ingredient_id: ingredientId })
      .del();
  }
}
