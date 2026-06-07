import { z } from "zod";
import { buffProfileSchema } from "@/persistence/schemas/characters/buffs/buffProfileSchema";

export const buffsSchema = z.object
({
  buffProfiles: z.array(buffProfileSchema).max(20, { message: "Możesz mieć najwyżej 20 profili wzmocnień." }),
  activeBuffProfileId: z.ulid().optional().nullable(),
});

export type BuffsDto = z.infer<typeof buffsSchema>;