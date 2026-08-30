import knex, { type Knex } from "knex";
import { databaseConfig } from "src/storage/db/config.js";
import { createFridgesTable } from "src/storage/db/fridges/schema.js";
import { createIngredientsTable } from "src/storage/db/ingredients/schema.js";
import { seedDatabase } from "src/storage/db/seed_data.js";
import { createUsersTable } from "src/storage/db/users/schema.js";

export const db: Knex = knex({
  client: "mysql2",
  connection: databaseConfig,
  pool: { min: 0, max: 10 },
});

export async function initializeDatabase(): Promise<void> {
  await createUsersTable(db);
  await createIngredientsTable(db);
  await createFridgesTable(db);
  await seedDatabase(db);
}
