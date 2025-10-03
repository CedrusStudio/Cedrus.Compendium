import { castTimeValues } from "@/domain/Character";
import { z } from "zod";

// Schema for character header (name and description)
export const upsertCharacterHeaderSchema = z.object
({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string()
        .min(2, { message: "Description must be at least 2 characters." })
        .max(600, { message: "Description must not be longer than 600 characters." }),
});

export const addCharacterHeaderSchema = z.object
({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string()
        .min(2, { message: "Description must be at least 2 characters." })
        .max(600, { message: "Description must not be longer than 600 characters." }),
});

export type UpsertCharacterHeaderType = z.infer<typeof upsertCharacterHeaderSchema>;
export type AddCharacterHeaderType = z.infer<typeof addCharacterHeaderSchema>;

// New schema for character statistics
export const statisticSchema = z.object
({
  grade: z.coerce.number<number>().int().min(1, { message: "Grade must be at least 1." }).max(50, { message: "Grade must be at most 50." }),
  value: z.coerce.number<number>().int().min(-10, { message: "Value must be at least -10." }).max(25, { message: "Value must be at most 25." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus must be at least -10." }).max(20, { message: "Bonus must be at most 20." }),
  testBonus: z.coerce.number<number>().int().min(-10, { message: "Test bonus must be at least -10." }).max(20, { message: "Test bonus must be at most 20." }),
});

export const characterCharacteristicsSchema = z.object
({
  strength: statisticSchema,
  dexterity: statisticSchema,
  constitution: statisticSchema,
  mind: statisticSchema,
  charisma: statisticSchema,
  spellborn: statisticSchema,
});

export const characterAttributesSchema = z.object
({
  fencing: statisticSchema,
  artifice: statisticSchema,
  precision: statisticSchema,
  initiative: statisticSchema,
  martialArt: statisticSchema,
  horsemanship: statisticSchema,

  fortitude: statisticSchema,
  reflex: statisticSchema,
  willpower: statisticSchema,
});

export const upsertCharacterStatisticsSchema = z.object
({
    characteristics: characterCharacteristicsSchema,
    attributes: characterAttributesSchema,
});

//Talents
export const talentSchema = z.object
({
  id: z.string().min(2, { message: "ID must be at least 2 characters." }).max(100, { message: "ID must be at most 100 characters." }),
  category: z.string().min(2, { message: "Category must be at least 2 characters." }).max(100, { message: "Category must be at most 100 characters." }),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100, { message: "Name must be at most 100 characters." }),
  characteristics: z.string().min(2, { message: "Characteristics must be at least 2 characters." }).max(100, { message: "Characteristics must be at most 100 characters." }),
  grade: z.coerce.number<number>().int().min(1, { message: "Grade must be at least 1." }).max(50, { message: "Grade must be at most 50." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus must be at least -10." }).max(50, { message: "Bonus must be at most 50." }),
  penalty: z.coerce.number<number>().int().min(-10, { message: "Penalty must be at least -10." }).max(50, { message: "Penalty must be at most 50." }),
}).required();

export const upsertCharacterTalentsSchema = z.object
({
  talents: z.array(talentSchema)
});

//Export types
export type UpsertCharacterStatisticsType = z.infer<typeof upsertCharacterStatisticsSchema>;
export type UpsertCharacterTalentsType = z.infer<typeof upsertCharacterTalentsSchema>;

// New schema for character statistics

const criticalSchema = z.object
({
  power: z.coerce.number<number>().int().min(-5, { message: "Power must be at least -5." }).max(50, { message: "Power must be at most 50." }),
  range: z.coerce.number<number>().int().min(-5, { message: "Range must be at least -5." }).max(50, { message: "Range must be at most 50." }),
});

const weaponOffenseSchema = z.object
({
  amount: z.coerce.number<number>().int().min(1, { message: "Amount must be at least 1." }).max(10, { message: "Amount must be at most 10." }),
  grade: z.coerce.number<number>().int().min(1, { message: "Grade must be at least 1." }).max(50, { message: "Grade must be at most 50." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus must be at least -10." }).max(50, { message: "Bonus must be at most 50." }),
  critical: criticalSchema,
});

const damageOffenseSchema = z.object
({ 
  amount: z.coerce.number<number>().int().min(0, { message: "Amount must be at least 0." }).max(10, { message: "Amount must be at most 10." }),
  grade: z.coerce.number<number>().int().min(1, { message: "Grade must be at least 1." }).max(50, { message: "Grade must be at most 50." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus must be at least -10." }).max(50, { message: "Bonus must be at most 50." }),
});

const itemSchema = z.object
({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100, { message: "Name must be at most 100 characters." }),
  description: z.string().max(600, { message: "Description must be at most 600 characters." }),
});

export const upsertWeaponSchema = itemSchema.extend
({
  style: z.string().min(2, { message: "ID must be at least 2 characters." }).max(100, { message: "ID must be at most 100 characters." }),
  offense: weaponOffenseSchema,
  damageBonus: damageOffenseSchema,
  range: z.coerce.number<number>().int().min(-5, { message: "Range must be at least -5." }).max(50, { message: "Range must be at most 50." }),
});

const defenseItemSchema = itemSchema.extend
({
  dexterityRestriction: z.coerce.number<number>().int().min(0, { message: "Dexterity restriction must be at least 0." }).max(10, { message: "Dexterity restriction must be at most 10." }),
  reflexRestriction: z.coerce.number<number>().int().min(0, { message: "Reflex restriction must be at least 0." }).max(10, { message: "Reflex restriction must be at most 10." }),
  initiativeRestriction: z.coerce.number<number>().int().min(0, { message: "Initiative restriction must be at least 0." }).max(10, { message: "Initiative restriction must be at most 10." }),
  attributePenalty: z.coerce.number<number>().int().min(0, { message: "Attribute penalty must be at least 0." }).max(10, { message: "Attribute penalty must be at most 10." }),
  strengthRequirement: z.coerce.number<number>().int().min(0, { message: "Strength requirement must be at least 0." }).max(20, { message: "Strength requirement must be at most 20." }),
});

const armorSchema = defenseItemSchema.extend
({
  protection: z.coerce.number<number>().int().min(0, { message: "Protection must be at least 0." }).max(50, { message: "Protection must be at most 50." }),
});

const shieldSchema = defenseItemSchema.extend
({
  block: z.coerce.number<number>().int().min(0, { message: "Block must be at least 0." }).max(50, { message: "Block must be at most 50." }),
});

const magicItemSchema = itemSchema.extend
({
  reduction: z.coerce.number<number>().int().min(0, { message: "Reduction must be at least 0." }).max(50, { message: "Reduction must be at most 50." }),
  resistance: z.coerce.number<number>().int().min(0, { message: "Resistance must be at least 0." }).max(50, { message: "Resistance must be at most 50." }),
  immunity: z.coerce.number<number>().int().min(0, { message: "Immunity must be at least 0." }).max(50, { message: "Immunity must be at most 50." }),
});

const horseSchema = itemSchema.extend
({
  paceSpeed: z.coerce.number<number>().int().min(1, { message: "Pace speed must be at least 1." }).max(50, { message: "Pace speed must be at most 50." }),
  gallopSpeed: z.coerce.number<number>().int().min(1, { message: "Gallop speed must be at least 1." }).max(100, { message: "Gallop speed must be at most 100." }),
  canterSpeed: z.coerce.number<number>().int().min(1, { message: "Canter speed must be at least 1." }).max(175, { message: "Canter speed must be at most 175." }),
  horsemanshipBonus: z.coerce.number<number>().int().min(-10, { message: "Horsemanship bonus must be at least -10." }).max(20, { message: "Horsemanship bonus must be at most 20." }),
});

export const upsertCharacterEquipmentSchema = z.object
({
  weapon1: upsertWeaponSchema,
  weapon2: upsertWeaponSchema.optional(),
  weapon3: upsertWeaponSchema.optional(),
  weapon4: upsertWeaponSchema.optional(),
  armor: armorSchema,
  shield: shieldSchema,
  magicEquipment: z.array(magicItemSchema).max(10, { message: "You can have at most 10 magic equipment items." }),
  horse: horseSchema.optional(),
});

export type UpsertCharacterWeaponType = z.infer<typeof upsertWeaponSchema>;
export type UpsertCharacterEquipmentType = z.infer<typeof upsertCharacterEquipmentSchema>;

//Health
export const healthSchema = z.object
({
  barrier: z.coerce.number<number>().int().min(0, { message: "Barrier must be at least 0." }).max(1000, { message: "Barrier must be at most 1000." }),
  vitality: z.coerce.number<number>().int().min(1, { message: "Vitality must be at least 1." }).max(1000, { message: "Vitality must be at most 1000." }),
  toughness: z.coerce.number<number>().int().min(0, { message: "Toughness must be at least 0." }).max(20, { message: "Toughness must be at most 20." }),
  recoveryLevel: z.coerce.number<number>().int().min(0, { message: "Recovery level must be at least 0." }).max(20, { message: "Recovery level must be at most 20." }),
  lethalHealth: z.coerce.number<number>().int().min(0, { message: "Lethal health must be at least 0." }).max(50, { message: "Lethal health must be at most 50." }),
  lethalRounds: z.coerce.number<number>().int().min(0, { message: "Lethal rounds must be at least 0." }).max(20, { message: "Lethal rounds must be at most 20." }),
  bonus: z.coerce.number<number>().int().min(-50, { message: "Bonus must be at least -50." }).max(1000, { message: "Bonus must be at most 1000." })
});

export type UpsertCharacterHealthType = z.infer<typeof healthSchema>;

//Defense
export const defenseSchema = z.object
({
  immunity: z.coerce.number<number>().int().min(0, { message: "Immunity must be at least 0." }).max(50, { message: "Immunity must be at most 50." }),
  resistance: z.coerce.number<number>().int().min(0, { message: "Resistance must be at least 0." }).max(50, { message: "Resistance must be at most 50." }),
  protection: z.coerce.number<number>().int().min(0, { message: "Protection must be at least 0." }).max(50, { message: "Protection must be at most 50." }),
  block: z.coerce.number<number>().int().min(0, { message: "Block must be at least 0." }).max(50, { message: "Block must be at most 50." }),
  parry: z.coerce.number<number>().int().min(0, { message: "Parry must be at least 0." }).max(50, { message: "Parry must be at most 50." }),
  dodge: z.coerce.number<number>().int().min(0, { message: "Dodge must be at least 0." }).max(50, { message: "Dodge must be at most 50." }),
  bonus: z.coerce.number<number>().int().min(-50, { message: "Bonus must be at least -50." }).max(1000, { message: "Bonus must be at most 1000." })
});

export type UpsertCharacterDefenseType = z.infer<typeof defenseSchema>;

//Mode
export const modeSchema = z.object
({
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(1000),
  grade: z.coerce.number<number>().int().min(0)
});

export type UpsertCharacterModeType = z.infer<typeof modeSchema>;
export const upsertCharacterModesSchema = z.array(modeSchema).max(20, { message: "You can have at most 20 modes." });

//Maneuvers
const maneuverSchema = z.object
({
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(1000),
  grade: z.coerce.number<number>().int().min(0),
  cooldown: z.coerce.number<number>().int().min(0).max(20).optional(),
  castTime: z.enum(castTimeValues),
});

export type UpsertCharacterManeuverType = z.infer<typeof maneuverSchema>;
export const upsertCharacterManeuversSchema = z.array(maneuverSchema).max(100, { message: "You can have at most 100 maneuvers." });

//Offense
const offenseSchema = z.object
({
  leadingWeapon: weaponOffenseSchema,
  secondaryWeapon: weaponOffenseSchema.optional(),
  damageBonus: damageOffenseSchema,
});

//Combat
export const upsertCharacterCombatSchema = z.object
({
  health: healthSchema,
  defense: defenseSchema,
  stances: upsertCharacterModesSchema,
  states: upsertCharacterModesSchema,
  maneuvers: upsertCharacterManeuversSchema,
  offense: offenseSchema
});

export type UpsertCharacterCombatType = z.infer<typeof upsertCharacterCombatSchema>;
