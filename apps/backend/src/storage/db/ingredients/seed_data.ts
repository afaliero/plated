import type { Knex } from "knex";
import { INGREDIENTS_TABLE } from "src/storage/db/ingredients/schema.js";
import type { IngredientRow } from "src/storage/db/ingredients/types.js";

const INGREDIENTS: IngredientRow[] = [
  { id: 1, name: "chicken" },
  { id: 2, name: "rice" },
  { id: 3, name: "broccoli" },
  { id: 4, name: "garlic" },
  { id: 5, name: "olive oil" },
];

export async function seedIngredients(db: Knex): Promise<void> {
  const existing = await db<IngredientRow>(INGREDIENTS_TABLE).first("id");
  if (!existing) await db<IngredientRow>(INGREDIENTS_TABLE).insert(INGREDIENTS);
}
