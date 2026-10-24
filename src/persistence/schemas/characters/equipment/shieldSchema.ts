import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { defenseItemSchema } from "@/persistence/schemas/characters/equipment/defenseItemSchema";

export const shieldSchema = defenseItemSchema.extend
({
  block: numberInput(z.coerce.number<number>().int().min(0, { message: "Blokowanie musi mieć co najmniej 0." }).max(50, { message: "Blokowanie musi mieć najwyżej 50." })),
});

export type ShieldDto = z.infer<typeof shieldSchema>;