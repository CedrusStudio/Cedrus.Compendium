import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";
import { tagsSchema } from "@/persistence/schemas/tagSchema";

export const itemSchema = entitySchema.extend
({
  description: z.string().max(2000, { message: "Opis musi mieć najwyżej 2000 znaków." }),
  tags: tagsSchema
});

export type InventoryItemDto = z.infer<typeof itemSchema>;