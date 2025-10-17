import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";

export const itemSchema = entitySchema.extend
({
  description: z.string().max(2000, { message: "Opis musi mieć najwyżej 2000 znaków." }),
});