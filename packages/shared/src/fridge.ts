import { z } from "zod";

export const FridgeItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(150),
});
export type FridgeItem = z.infer<typeof FridgeItemSchema>;

export const AddFridgeItemRequestSchema = z.strictObject({
  name: z
    .string()
    .transform((name) =>
      name.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " "),
    )
    .pipe(z.string().min(1, "Enter an ingredient name.").max(150)),
});
export type AddFridgeItemRequest = z.infer<typeof AddFridgeItemRequestSchema>;

export const FridgeResponseSchema = z.object({
  items: z.array(FridgeItemSchema),
});
export type FridgeResponse = z.infer<typeof FridgeResponseSchema>;
