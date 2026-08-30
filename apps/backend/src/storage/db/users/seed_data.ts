import type { Knex } from "knex";
import { USERS_TABLE } from "src/storage/db/users/schema.js";
import type { UserRow } from "src/storage/db/users/types.js";

const USERS: UserRow[] = [
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
];

export async function seedUsers(db: Knex): Promise<void> {
  const existing = await db<UserRow>(USERS_TABLE).first("id");
  if (!existing) await db<UserRow>(USERS_TABLE).insert(USERS);
}
