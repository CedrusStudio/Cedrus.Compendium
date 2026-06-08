import { z } from "zod";
import { headerSchema } from "@/persistence/schemas/characters/headerSchema";
import { statisticsSchema } from "@/persistence/schemas/characters/statistics/statisticsSchema";
import { talentsSchema } from "@/persistence/schemas/characters/talentSchema";
import { combatSchema } from "@/persistence/schemas/characters/combat/combatSchema";
import { buffsSchema } from "@/persistence/schemas/characters/buffs/buffsSchema";

export const copyCreateCharacterSchema = z.object
({
  // Required: new header information
  name: headerSchema.shape.name,
  shortName: headerSchema.shape.shortName,
  description: headerSchema.shape.description,
  tags: headerSchema.shape.tags,
  raceId: headerSchema.shape.raceId,
  
  // All other properties from the base character
  characteristics: statisticsSchema.shape.characteristics,
  attributes: statisticsSchema.shape.attributes,
  talents: talentsSchema.shape.talents,
  health: combatSchema.shape.health,
  defenses: combatSchema.shape.defenses,
  defaultDefenseId: combatSchema.shape.defaultDefenseId,
  offenses: combatSchema.shape.offenses,
  defaultOffenseId: combatSchema.shape.defaultOffenseId,
  powers: combatSchema.shape.powers,
  buffProfiles: buffsSchema.shape.buffProfiles,
  activeBuffProfileIds: buffsSchema.shape.activeBuffProfileIds,
  stanceModifierProfiles: buffsSchema.shape.stanceModifierProfiles,
  activeStanceModifierProfileIds: buffsSchema.shape.activeStanceModifierProfileIds,
  stateModifierProfiles: buffsSchema.shape.stateModifierProfiles,
  activeStateModifierProfileIds: buffsSchema.shape.activeStateModifierProfileIds,
  otherModifierProfiles: buffsSchema.shape.otherModifierProfiles,
  activeOtherModifierProfileIds: buffsSchema.shape.activeOtherModifierProfileIds,

  // Relation ids for equipment
  weaponsIds: z.array(z.string()),
  armorsIds: z.array(z.string()),
  shieldsIds: z.array(z.string()),
  inventoryIds: z.array(z.string()),
  mountsIds: z.array(z.string()),

  // Relation ids for other entities
  stancesIds: z.array(z.string()),
  statesIds:  z.array(z.string()),
  maneuversIds: z.array(z.string()),
  spellsIds: z.array(z.string()),
  perksIds: z.array(z.string()),
  powerSpecificationsIds: z.array(z.string())
});

export type CopyCreateCharacterDto = z.infer<typeof copyCreateCharacterSchema>;
