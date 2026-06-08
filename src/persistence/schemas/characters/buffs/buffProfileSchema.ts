import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";

const optionalBuffDescriptionSchema = z.union([
  z.literal(""),
  z.string().min(2).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
]).optional();

export const statisticBuffSchema = z.object
({
  grade: z.coerce.number<number>().int().min(-20, { message: "Modyfikator rangi musi mieć co najmniej -20." }).max(20, { message: "Modyfikator rangi musi mieć najwyżej 20." }),
  value: z.coerce.number<number>().int().min(-100, { message: "Modyfikator wartości musi mieć co najmniej -100." }).max(100, { message: "Modyfikator wartości musi mieć najwyżej 100." }),
  bonus: z.coerce.number<number>().int().min(-100, { message: "Modyfikator bonusu musi mieć co najmniej -100." }).max(100, { message: "Modyfikator bonusu musi mieć najwyżej 100." }),
  testBonus: z.coerce.number<number>().int().min(-100, { message: "Modyfikator bonusu testu musi mieć co najmniej -100." }).max(100, { message: "Modyfikator bonusu testu musi mieć najwyżej 100." }),
});

const healthBuffSchema = z.object
({
  barrier: z.coerce.number<number>().int().min(-1000).max(1000),
  vitality: z.coerce.number<number>().int().min(-1000).max(1000),
  toughness: z.coerce.number<number>().int().min(-100).max(100),
  recoveryLevel: z.coerce.number<number>().int().min(-20).max(20),
  lethalHealth: z.coerce.number<number>().int().min(-100).max(100),
  lethalRounds: z.coerce.number<number>().int().min(-100).max(100),
  bonus: z.coerce.number<number>().int().min(-1000).max(1000),
});

const defenseBuffSchema = z.object
({
  immunity: z.coerce.number<number>().int().min(-100).max(100),
  resistance: z.coerce.number<number>().int().min(-100).max(100),
  protection: z.coerce.number<number>().int().min(-100).max(100),
  block: z.coerce.number<number>().int().min(-100).max(100),
  parry: z.coerce.number<number>().int().min(-100).max(100),
  dodge: z.coerce.number<number>().int().min(-100).max(100),
  bonus: z.coerce.number<number>().int().min(-100).max(100),
});

const damageOffenseBuffSchema = z.object
({
  amount: z.coerce.number<number>().int().min(-20).max(20),
  grade: z.coerce.number<number>().int().min(-20).max(20),
  bonus: z.coerce.number<number>().int().min(-100).max(100),
});

const weaponOffenseBuffSchema = damageOffenseBuffSchema.extend
({
  criticalPower: z.coerce.number<number>().int().min(-100).max(100),
  criticalRange: z.coerce.number<number>().int().min(-100).max(100),
});

const characteristicsBuffSchema = z.object
({
  strength: statisticBuffSchema,
  dexterity: statisticBuffSchema,
  constitution: statisticBuffSchema,
  mind: statisticBuffSchema,
  charisma: statisticBuffSchema,
  spellborn: statisticBuffSchema,
});

const attributesBuffSchema = z.object
({
  fencing: statisticBuffSchema,
  artifice: statisticBuffSchema,
  precision: statisticBuffSchema,
  initiative: statisticBuffSchema,
  martialArt: statisticBuffSchema,
  horsemanship: statisticBuffSchema,
  fortitude: statisticBuffSchema,
  reflex: statisticBuffSchema,
  willpower: statisticBuffSchema,
});

const offenseBuffSchema = z.object
({
  leadingWeapon: weaponOffenseBuffSchema,
  secondaryWeapon: weaponOffenseBuffSchema,
  damageBonus: damageOffenseBuffSchema,
  additionalDamageBonus: damageOffenseBuffSchema,
});

export const buffProfileSchema = entitySchema.extend
({
  description: optionalBuffDescriptionSchema,
  linkedEntityId: z.ulid().optional().nullable(),
  characteristics: characteristicsBuffSchema,
  attributes: attributesBuffSchema,
  health: healthBuffSchema,
  defense: defenseBuffSchema,
  offense: offenseBuffSchema,
});

export type BuffProfileDto = z.infer<typeof buffProfileSchema>;