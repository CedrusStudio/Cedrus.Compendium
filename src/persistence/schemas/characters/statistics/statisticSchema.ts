import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";

export const statisticSchema = z.object
({
  grade: numberInput(z.coerce.number<number>().int().min(1, { message: "Ranga musi mieć co najmniej 1." }).max(50, { message: "Ranga musi być najwyżej 50." })),
  value: numberInput(z.coerce.number<number>().int().min(-10, { message: "Wartość musi być co najmniej -10." }).max(25, { message: "Wartość musi być najwyżej 25." })),
  bonus: numberInput(z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(20, { message: "Bonus musi być najwyżej 20." })),
  testBonus: numberInput(z.coerce.number<number>().int().min(-10, { message: "Bonus testowy musi być co najmniej -10." }).max(20, { message: "Bonus testowy musi być najwyżej 20." })),
});