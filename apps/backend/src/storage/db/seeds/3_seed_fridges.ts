import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("fridges").del();
  await knex("fridges").insert([
    { user_id: 1, ingredient_id: 1 },
    { user_id: 1, ingredient_id: 2 },
    { user_id: 1, ingredient_id: 4 },
    { user_id: 2, ingredient_id: 2 },
    { user_id: 2, ingredient_id: 3 },
    { user_id: 2, ingredient_id: 5 },
  ]);
}
