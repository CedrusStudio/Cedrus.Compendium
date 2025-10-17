import { allowedTalentPenalties } from "@/domain/characters/Talent";
import { z } from "zod";
import { idSchema } from "@/persistence/schemas/entitySchema";

const talentSchema = z.object
({
  category: z.string().min(2, { message: "Kategoria musi mieć co najmniej 2 znaki." }).max(100, { message: "Kategoria nie może być dłuższa niż 100 znaków." }),
  name: z.string().min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." }).max(100, { message: "Nazwa nie może być dłuższa niż 100 znaków." }),
  characteristics: z.string().min(2, { message: "Cecha musi mieć co najmniej 2 znaki." }).max(100, { message: "Cecha musi mieć najwyżej 100 znaków." }),
  grade: z.coerce.number<number>().int().min(1, { message: "Ranga musi mieć co najmniej 1." }).max(50, { message: "Ranga musi być najwyżej 50." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(50, { message: "Bonus musi być najwyżej 50." }),
  penalty: z.enum(allowedTalentPenalties).optional(),
  ...idSchema.shape
});

export const talentsSchema = z.object
({
  talents: z.array(talentSchema)
});

export type TalentsDto = z.infer<typeof talentsSchema>;