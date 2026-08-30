import type { Knex } from "knex";
import { FRIDGES_TABLE } from "src/storage/db/fridges/schema.js";
import type { FridgeRow } from "src/storage/db/fridges/types.js";

const FRIDGE_ITEMS: FridgeRow[] = [
  { user_id: 1, ingredient_id: 1 },
  { user_id: 1, ingredient_id: 2 },
  { user_id: 1, ingredient_id: 4 },
  { user_id: 2, ingredient_id: 2 },
  { user_id: 2, ingredient_id: 3 },
  { user_id: 2, ingredient_id: 5 },
];

export async function seedFridges(db: Knex): Promise<void> {
  const existing = await db<FridgeRow>(FRIDGES_TABLE).first("user_id");
  if (!existing) await db<FridgeRow>(FRIDGES_TABLE).insert(FRIDGE_ITEMS);
}
