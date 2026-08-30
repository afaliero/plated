import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("fridges").del();
  await knex("users").del();
  await knex("users").insert([
    {
      id: 1,
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
      password_hash: null,
    },
    {
      id: 2,
      first_name: "Grace",
      last_name: "Hopper",
      email: "grace@example.com",
      password_hash: null,
    },
  ]);
}
