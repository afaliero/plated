import type { Knex } from "knex";

export const USERS_TABLE = "users";

export async function createUsersTable(db: Knex): Promise<void> {
  if (await db.schema.hasTable(USERS_TABLE)) return;

  await db.schema.createTable(USERS_TABLE, (table) => {
    table.increments("id").primary();
    table.string("first_name", 100).notNullable();
    table.string("last_name", 100).notNullable();
    table.string("email", 320).notNullable().unique();
    // Store a salted password hash, never a password or a salt by itself.
    table.string("password_hash", 255).nullable();
  });
}
