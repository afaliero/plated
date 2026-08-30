import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("fridges").del();
  await knex("ingredients").del();
  await knex("ingredients").insert([
    { id: 1, name: "chicken" },
    { id: 2, name: "rice" },
    { id: 3, name: "broccoli" },
    { id: 4, name: "garlic" },
    { id: 5, name: "olive oil" },
  ]);
}
