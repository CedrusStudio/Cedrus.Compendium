import { castTimeValues } from "@/domain/data/castTimes";
import { z } from "zod";

// Schema for character header (name and description)
export const upsertCharacterHeaderSchema = z.object
({
    name: z.string().min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." }),
    description: z.string()
        .min(2, { message: "Opis musi mieć co najmniej 2 znaki." })
        .max(600, { message: "Opis nie może być dłuższy niż 600 znaków." }),
});

export const addCharacterHeaderSchema = z.object
({
    name: z.string().min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." }),
    description: z.string()
        .min(2, { message: "Opis musi mieć co najmniej 2 znaki." })
        .max(10_000, { message: "Opis nie może być dłuższy niż 10 000 znaków." }),
});

export type UpsertCharacterHeaderType = z.infer<typeof upsertCharacterHeaderSchema>;
export type AddCharacterHeaderType = z.infer<typeof addCharacterHeaderSchema>;

// New schema for character statistics
export const statisticSchema = z.object
({
  grade: z.coerce.number<number>().int().min(1, { message: "Ranga musi mieć co najmniej 1." }).max(50, { message: "Ranga musi być najwyżej 50." }),
  value: z.coerce.number<number>().int().min(-10, { message: "Wartość musi być co najmniej -10." }).max(25, { message: "Wartość musi być najwyżej 25." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(20, { message: "Bonus musi być najwyżej 20." }),
  testBonus: z.coerce.number<number>().int().min(-10, { message: "Bonus testowy musi być co najmniej -10." }).max(20, { message: "Bonus testowy musi być najwyżej 20." }),
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
export const newTalentSchema = z.object
({
  category: z.string().min(2, { message: "Kategoria musi mieć co najmniej 2 znaki." }).max(100, { message: "Kategoria nie może być dłuższa niż 100 znaków." }),
  name: z.string().min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." }).max(100, { message: "Nazwa nie może być dłuższa niż 100 znaków." }),
  characteristics: z.string().min(2, { message: "Cecha musi mieć co najmniej 2 znaki." }).max(100, { message: "Cecha musi mieć najwyżej 100 znaków." }),
  grade: z.coerce.number<number>().int().min(1, { message: "Ranga musi mieć co najmniej 1." }).max(50, { message: "Ranga musi być najwyżej 50." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(50, { message: "Bonus musi być najwyżej 50." }),
  penalty: z.coerce.number<number>().int().min(0, { message: "Kara musi być co najmniej 0." }).max(50, { message: "Kara musi być najwyżej 50." }),
});

export const talentSchema = newTalentSchema.extend
({
  id: z.string().min(2, { message: "ID musi mieć co najmniej 2 znaki." }).max(100, { message: "ID musi mieć najwyżej 100 znaków." })
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
  power: z.coerce.number<number>().int().min(-5, { message: "Sia Krytyka musi mieć co najmniej -5." }).max(50, { message: "Sia Krytyka musi mieć najwyżej 50." }),
  range: z.coerce.number<number>().int().min(-5, { message: "Zasięg Krytyka musi mieć co najmniej -5." }).max(50, { message: "Zasięg Krytyka musi mieć najwyżej 50." }),
});

const weaponOffenseSchema = z.object
({
  amount: z.coerce.number<number>().int().min(1, { message: "Ilość musi być co najmniej 1." }).max(10, { message: "Ilość nie może być większa niż 10." }),
  grade: z.coerce.number<number>().int().min(1, { message: "Ranga musi być co najmniej 1." }).max(50, { message: "Ranga nie może być większa niż 50." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(50, { message: "Bonus nie może być większy niż 50." }),
  critical: criticalSchema,
});

const damageOffenseSchema = z.object
({ 
  amount: z.coerce.number<number>().int().min(0, { message: "Ilość musi być co najmniej 0." }).max(10, { message: "Ilość musi być najwyżej 10." }),
  grade: z.coerce.number<number>().int().min(1, { message: "Ranga musi być co najmniej 1." }).max(50, { message: "Ranga musi być najwyżej 50." }),
  bonus: z.coerce.number<number>().int().min(-10, { message: "Bonus musi być co najmniej -10." }).max(50, { message: "Bonus musi być najwyżej 50." }),
});

const itemSchema = z.object
({
  name: z.string().min(2, { message: "Nazwa musi mieć co najmniej 2 znaki." }).max(100, { message: "Nazwa musi mieć najwyżej 100 znaków." }),
  description: z.string().max(2000, { message: "Opis musi mieć najwyżej 2000 znaków." }),
});

export const upsertWeaponSchema = itemSchema.extend
({
  style: z.string().min(2, { message: "ID musi mieć co najmniej 2 znaki." }).max(100, { message: "ID musi mieć najwyżej 100 znaków." }),
  offense: weaponOffenseSchema,
  damageBonus: damageOffenseSchema,
  range: z.coerce.number<number>().int().min(-5, { message: "Zasięg Krytyka musi mieć co najmniej -5." }).max(50, { message: "Zasięg Krytyka musi mieć najwyżej 50." }),
});

const defenseItemSchema = itemSchema.extend
({
  dexterityRestriction: z.coerce.number<number>().int().min(-10, { message: "Ograniczenie zręczności musi mieć co najmniej -10." }).max(10, { message: "Ograniczenie zręczności musi mieć najwyżej 10." }),
  reflexRestriction: z.coerce.number<number>().int().min(0, { message: "Ograniczenie refleksu musi mieć co najmniej 0." }).max(10, { message: "Ograniczenie refleksu musi mieć najwyżej 10." }),
  initiativeRestriction: z.coerce.number<number>().int().min(0, { message: "Ograniczenie inicjatywy musi mieć co najmniej 0." }).max(10, { message: "Ograniczenie inicjatywy musi mieć najwyżej 10." }),
  attributePenalty: z.coerce.number<number>().int().min(0, { message: "Kara za atrybut musi mieć co najmniej 0." }).max(10, { message: "Kara za atrybut musi mieć najwyżej 10." }),
  strengthRequirement: z.coerce.number<number>().int().min(0, { message: "Wymaganie siły musi mieć co najmniej 0." }).max(20, { message: "Wymaganie siły musi mieć najwyżej 20." }),
});

const armorSchema = defenseItemSchema.extend
({
  protection: z.coerce.number<number>().int().min(0, { message: "Pancerz musi mieć co najmniej 0." }).max(50, { message: "Pancerz musi mieć najwyżej 50." }),
});

const shieldSchema = defenseItemSchema.extend
({
  block: z.coerce.number<number>().int().min(0, { message: "Blokowanie musi mieć co najmniej 0." }).max(50, { message: "Blokowanie musi mieć najwyżej 50." }),
});

const magicItemSchema = itemSchema.extend
({
  reduction: z.coerce.number<number>().int().min(0, { message: "Redukcja musi mieć co najmniej 0." }).max(50, { message: "Redukcja musi mieć najwyżej 50." }),
  resistance: z.coerce.number<number>().int().min(0, { message: "Odpornosc musi mieć co najmniej 0." }).max(50, { message: "Odpornosc musi mieć najwyżej 50." }),
  immunity: z.coerce.number<number>().int().min(0, { message: "Niewrażliwość musi mieć co najmniej 0." }).max(50, { message: "Niewrażliwość musi mieć najwyżej 50." }),
});

const horseSchema = itemSchema.extend
({
  paceSpeed: z.coerce.number<number>().int().min(1, { message: "Prędkość cwału musi mieć co najmniej 1." }).max(50, { message: "Prędkość cwału musi mieć najwyżej 50." }),
  gallopSpeed: z.coerce.number<number>().int().min(1, { message: "Prędkość galopu musi mieć co najmniej 1." }).max(100, { message: "Prędkość galopu musi mieć najwyżej 100." }),
  canterSpeed: z.coerce.number<number>().int().min(1, { message: "Prędkość kłusa musi mieć co najmniej 1." }).max(175, { message: "Prędkość kłusa musi mieć najwyżej 175." }),
  horsemanshipBonus: z.coerce.number<number>().int().min(-10, { message: "Bonus jeździecki musi mieć co najmniej -10." }).max(20, { message: "Bonus jeździecki musi mieć najwyżej 20." }),
});

export const upsertCharacterEquipmentSchema = z.object
({
  weapon1: upsertWeaponSchema,
  weapon2: upsertWeaponSchema.optional(),
  weapon3: upsertWeaponSchema.optional(),
  weapon4: upsertWeaponSchema.optional(),
  armor: armorSchema,
  shield: shieldSchema,
  magicEquipment: z.array(magicItemSchema).max(10, { message: "Możesz mieć najwyżej 10 przedmiotów magicznych." }),
  horse: horseSchema.optional(),
});

export type UpsertCharacterWeaponType = z.infer<typeof upsertWeaponSchema>;
export type UpsertCharacterEquipmentType = z.infer<typeof upsertCharacterEquipmentSchema>;

//Health
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

export type UpsertCharacterHealthType = z.infer<typeof healthSchema>;

//Defense
export const defenseSchema = z.object
({
  name: z.string().min(2).max(100),
  description: z.string().min(2).max(1000).optional(),
  immunity: z.coerce.number<number>().int().min(0, { message: "Niewrażliwość musi mieć co najmniej 0." }).max(50, { message: "Niewrażliwość musi mieć najwyżej 50." }),
  resistance: z.coerce.number<number>().int().min(0, { message: "Odporność musi mieć co najmniej 0." }).max(50, { message: "Odporność musi mieć najwyżej 50." }),
  protection: z.coerce.number<number>().int().min(0, { message: "Pancerz musi mieć co najmniej 0." }).max(50, { message: "Pancerz musi mieć najwyżej 50." }),
  block: z.coerce.number<number>().int().min(0, { message: "Blokowanie musi mieć co najmniej 0." }).max(50, { message: "Blokada musi mieć najwyżej 50." }),
  parry: z.coerce.number<number>().int().min(0, { message: "Parowanie musi mieć co najmniej 0." }).max(50, { message: "Parowanie musi mieć najwyżej 50." }),
  dodge: z.coerce.number<number>().int().min(0, { message: "Unikanie musi mieć co najmniej 0." }).max(50, { message: "Unikanie musi mieć najwyżej 50." }),
  bonus: z.coerce.number<number>().int().min(-50, { message: "Bonus musi mieć co najmniej -50." }).max(1000, { message: "Bonus musi mieć najwyżej 1000." })
});

export type UpsertCharacterDefenseType = z.infer<typeof defenseSchema>;

//Mode
export const modeSchema = z.object
({
  name: z.string().min(2).max(100, { message: "Nazwa musi mieć najwyżej 100 znaków." }),
  description: z.string().min(2).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
  grade: z.coerce.number<number>().int().min(0, { message: "Ranga musi mieć co najmniej 0." }).max(50, { message: "Ranga musi być najwyżej 50." }),
});

export type UpsertCharacterModeType = z.infer<typeof modeSchema>;
export const upsertCharacterModesSchema = z.array(modeSchema).max(20, { message: "Możesz mieć najwyżej 20 trybów." });

//Maneuvers
const maneuverSchema = z.object
({
  name: z.string().min(2).max(100, { message: "Nazwa musi mieć najwyżej 100 znaków." }),
  description: z.string().min(2).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
  grade: z.coerce.number<number>().int().min(0, { message: "Ranga musi mieć co najmniej 0." }).max(50, { message: "Ranga musi być najwyżej 50." }),
  cooldown: z.coerce.number<number>().int().min(0).max(20).optional(),
  castTime: z.enum(castTimeValues),
});

export type UpsertCharacterManeuverType = z.infer<typeof maneuverSchema>;
export const upsertCharacterManeuversSchema = z.array(maneuverSchema).max(100, { message: "Możesz mieć najwyżej 100 manewrów." });

//Offense
const offenseSchema = z.object
({
  name: z.string().min(2).max(100, { message: "Nazwa musi mieć najwyżej 100 znaków." }),
  description: z.string().min(2).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }).optional(),
  leadingWeapon: weaponOffenseSchema,
  secondaryWeapon: weaponOffenseSchema.optional(),
  damageBonus: damageOffenseSchema,
});

export type CharacterOffenseType = z.infer<typeof offenseSchema>;

//Combat
export const upsertCharacterCombatSchema = z.object
({
  health: healthSchema,
  defenses: z.array(defenseSchema).max(10, { message: "Możesz mieć najwyżej 10 zestawów obrony." }),
  stances: upsertCharacterModesSchema,
  states: upsertCharacterModesSchema,
  maneuvers: upsertCharacterManeuversSchema,
  offenses: z.array(offenseSchema).max(10, { message: "Możesz mieć najwyżej 10 zestawów ataku." })
});

export type UpsertCharacterCombatType = z.infer<typeof upsertCharacterCombatSchema>;
