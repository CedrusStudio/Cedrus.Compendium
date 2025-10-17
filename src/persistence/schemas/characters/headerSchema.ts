import { z } from "zod";
import { allowedCharacterCategories } from "@/domain/characters/Character";

const shortNameSchema = z
  .string()
  .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9]+$/, { message: "Pole może zawierać tylko litery, cyfry i polskie znaki."})
  .min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." })
  .max(15, { message: "Nazwa musi mieć co najwyżej 15 znaków." });

const characterCategorySchema = z.enum(allowedCharacterCategories, { message: "Nieprawidłowa kategoria." });

export const headerSchema = z.object
({
  name: z.string().min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." }),
  shortName: shortNameSchema,
  description: z.string().min(2, { message: "Opis musi mieć co najmniej 2 znaki." }).max(10_000, { message: "Opis nie może być dłuższy niż 10 000 znaków." }),
  category: characterCategorySchema,
});

export type HeaderDto = z.infer<typeof headerSchema>;