import { z } from "zod";

export const healthSchema = z.object
({
  barrier: z.coerce.number<number>().int().min(0, { message: "Bariera musi mieć co najmniej 0." }).max(1000, { message: "Bariera musi mieć najwyżej 1000." }),
  vitality: z.coerce.number<number>().int().min(1, { message: "Żywotność musi mieć co najmniej 1." }).max(1000, { message: "Żywotność musi mieć najwyżej 1000." }),
  toughness: z.coerce.number<number>().int().min(0, { message: "Twardość musi mieć co najmniej 0." }).max(20, { message: "Twardość musi mieć najwyżej 20." }),
  recoveryLevel: z.coerce.number<number>().int().min(0, { message: "Poziom regeneracji musi mieć co najmniej 0." }).max(20, { message: "Poziom regeneracji musi mieć najwyżej 20." }),
  lethalHealth: z.coerce.number<number>().int().min(0, { message: "Przeżywalność musi mieć co najmniej 0." }).max(50, { message: "Przeżywalność musi mieć najwyżej 50." }),
  lethalRounds: z.coerce.number<number>().int().min(0, { message: "Determinacja rund musi mieć co najmniej 0." }).max(20, { message: "Determinacja rund musi mieć najwyżej 20." }),
  bonus: z.coerce.number<number>().int().min(-50, { message: "Bonus musi mieć co najmniej -50." }).max(1000, { message: "Bonus musi mieć najwyżej 1000." })
});

export type HealthDto = z.infer<typeof healthSchema>;