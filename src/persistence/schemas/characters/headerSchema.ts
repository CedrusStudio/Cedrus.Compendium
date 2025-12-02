import { z } from "zod";
import { perksSchema } from "@/persistence/schemas/characters/perkSchema";
import { tagsSchema } from "@/persistence/schemas/tagSchema";

const shortNameSchema = z
  .string()
  .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9]+$/, { message: "Pole może zawierać tylko litery, cyfry i polskie znaki."})
  .min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." })
  .max(15, { message: "Nazwa musi mieć co najwyżej 15 znaków." });

export const headerSchema = z.object
({
  name: z.string().min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." }),
  shortName: shortNameSchema,
  description: z.string().min(2, { message: "Opis musi mieć co najmniej 2 znaki." }).max(10_000, { message: "Opis nie może być dłuższy niż 10 000 znaków." }),
  tags: tagsSchema,
  raceId: z.string().optional().nullable(),
});

export const detailsSchema = headerSchema.extend
({
  perks: perksSchema
});

export type DetailsDto = z.infer<typeof detailsSchema>;
export type HeaderDto = z.infer<typeof headerSchema>;