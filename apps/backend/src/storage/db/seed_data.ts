import type { Knex } from "knex";
import { seedFridges } from "src/storage/db/fridges/seed_data.js";
import { seedIngredients } from "src/storage/db/ingredients/seed_data.js";
import { seedUsers } from "src/storage/db/users/seed_data.js";

export async function seedDatabase(db: Knex): Promise<void> {
  await db.transaction(async (transaction) => {
    await seedUsers(transaction);
    await seedIngredients(transaction);
    await seedFridges(transaction);
  });
}
