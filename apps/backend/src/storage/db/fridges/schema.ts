import type { Knex } from "knex";
import { INGREDIENTS_TABLE } from "src/storage/db/ingredients/schema.js";
import { USERS_TABLE } from "src/storage/db/users/schema.js";

export const FRIDGES_TABLE = "fridges";

export async function createFridgesTable(db: Knex): Promise<void> {
  if (await db.schema.hasTable(FRIDGES_TABLE)) return;

  await db.schema.createTable(FRIDGES_TABLE, (table) => {
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable(USERS_TABLE)
      .onDelete("CASCADE");
    table
      .integer("ingredient_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable(INGREDIENTS_TABLE)
      .onDelete("CASCADE");
    table.primary(["user_id", "ingredient_id"]);
  });
}
