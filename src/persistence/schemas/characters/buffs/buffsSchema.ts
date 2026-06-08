import { z } from "zod";
import { buffProfileSchema } from "@/persistence/schemas/characters/buffs/buffProfileSchema";

const modifierProfilesSchema = z.array(buffProfileSchema).max(20, { message: "Możesz mieć najwyżej 20 profili modyfikacji w kategorii." });
const activeModifierProfileIdsSchema = z.array(z.ulid()).max(20, { message: "Możesz mieć najwyżej 20 aktywnych profili w kategorii." });

export const buffsSchema = z.object
({
  buffProfiles: modifierProfilesSchema,
  activeBuffProfileIds: activeModifierProfileIdsSchema,
  stanceModifierProfiles: modifierProfilesSchema,
  activeStanceModifierProfileIds: activeModifierProfileIdsSchema,
  stateModifierProfiles: modifierProfilesSchema,
  activeStateModifierProfileIds: activeModifierProfileIdsSchema,
  otherModifierProfiles: modifierProfilesSchema,
  activeOtherModifierProfileIds: activeModifierProfileIdsSchema,
});

export type BuffsDto = z.infer<typeof buffsSchema>;