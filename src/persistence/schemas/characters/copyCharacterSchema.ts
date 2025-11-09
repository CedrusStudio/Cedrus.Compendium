import { z } from "zod";
import { headerSchema } from "@/persistence/schemas/characters/headerSchema";
import { statisticsSchema } from "@/persistence/schemas/characters/statistics/statisticsSchema";
import { talentsSchema } from "@/persistence/schemas/characters/talentSchema";
import { combatSchema } from "@/persistence/schemas/characters/combat/combatSchema";

export const copyCreateCharacterSchema = z.object
({
  // Required: new header information
  name: headerSchema.shape.name,
  shortName: headerSchema.shape.shortName,
  description: headerSchema.shape.description,
  tags: headerSchema.shape.tags,
  
  // All other properties from the base character
  characteristics: statisticsSchema.shape.characteristics,
  attributes: statisticsSchema.shape.attributes,
  talents: talentsSchema.shape.talents,
  health: combatSchema.shape.health,
  defenses: combatSchema.shape.defenses,
  offenses: combatSchema.shape.offenses,
  powers: combatSchema.shape.powers,
  // Relation ids
  weaponsIds: z.array(z.string()),
  armorsIds: z.array(z.string()),
  shieldsIds: z.array(z.string()),
  inventoryIds: z.array(z.string()),
  mountsIds: z.array(z.string()),

  // Relation ids
  stancesIds: z.array(z.string()),
  statesIds:  z.array(z.string()),
  maneuversIds: z.array(z.string()),
  spellsIds: z.array(z.string()),
  perksIds: z.array(z.string())
});

export type CopyCreateCharacterDto = z.infer<typeof copyCreateCharacterSchema>;
