import { z } from "zod";

export const statisticSchema = z.object
({
  grade: z.coerce.number<number>().int().min(1, { message: "Ranga musi mieć co najmniej 1." }).max(50, { message: "Ranga musi być najwyżej 50." }),
  value: z.coerce.number<number>().int().min(-10, { message: "Wartość musi być co najmniej -10." }).max(25, { message: "Wartość musi być najwyżej 25." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(20, { message: "Bonus musi być najwyżej 20." }),
  testBonus: z.coerce.number<number>().int().min(-10, { message: "Bonus testowy musi być co najmniej -10." }).max(20, { message: "Bonus testowy musi być najwyżej 20." }),
});