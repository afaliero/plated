import type { Knex } from "knex";

export const INGREDIENTS_TABLE = "ingredients";

export async function createIngredientsTable(db: Knex): Promise<void> {
  if (await db.schema.hasTable(INGREDIENTS_TABLE)) return;

  await db.schema.createTable(INGREDIENTS_TABLE, (table) => {
    table.increments("id").primary();
    table.string("name", 150).notNullable().unique();
  });
}
