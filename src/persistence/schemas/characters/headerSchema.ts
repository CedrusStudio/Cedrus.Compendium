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
  perks: perksSchema,
  // Which API keys can see this character (from the same pool as the admin
  // NEXT_API_KEYS). Empty/omitted means the character is public. The actual
  // "must belong to the configured admin keys" rule is enforced server-side
  // in charactersRepository.ts, not here — this schema also runs client-side
  // for the edit form, and adminApiKeys (NEXT_API_KEYS) is a server-only env var.
  apiKeys: z.array(z.string().min(1)).optional(),
});

export type DetailsDto = z.infer<typeof detailsSchema>;
export type HeaderDto = z.infer<typeof headerSchema>;