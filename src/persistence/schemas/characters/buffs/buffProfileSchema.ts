import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";

const optionalBuffDescriptionSchema = z.union([
  z.literal(""),
  z.string().min(2).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
]).optional();

export const statisticBuffSchema = z.object
({
  grade: numberInput(z.coerce.number<number>().int().min(-20, { message: "Modyfikator rangi musi mieć co najmniej -20." }).max(20, { message: "Modyfikator rangi musi mieć najwyżej 20." })),
  value: numberInput(z.coerce.number<number>().int().min(-100, { message: "Modyfikator wartości musi mieć co najmniej -100." }).max(100, { message: "Modyfikator wartości musi mieć najwyżej 100." })),
  bonus: numberInput(z.coerce.number<number>().int().min(-100, { message: "Modyfikator bonusu musi mieć co najmniej -100." }).max(100, { message: "Modyfikator bonusu musi mieć najwyżej 100." })),
  testBonus: numberInput(z.coerce.number<number>().int().min(-100, { message: "Modyfikator bonusu testu musi mieć co najmniej -100." }).max(100, { message: "Modyfikator bonusu testu musi mieć najwyżej 100." })),
});

const healthBuffSchema = z.object
({
  barrier: numberInput(z.coerce.number<number>().int().min(-1000).max(1000)),
  vitality: numberInput(z.coerce.number<number>().int().min(-1000).max(1000)),
  toughness: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  recoveryLevel: numberInput(z.coerce.number<number>().int().min(-20).max(20)),
  lethalHealth: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  lethalRounds: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  bonus: numberInput(z.coerce.number<number>().int().min(-1000).max(1000)),
});

const defenseBuffSchema = z.object
({
  immunity: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  resistance: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  protection: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  block: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  parry: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  dodge: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  bonus: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
});

const damageOffenseBuffSchema = z.object
({
  amount: numberInput(z.coerce.number<number>().int().min(-20).max(20)),
  grade: numberInput(z.coerce.number<number>().int().min(-20).max(20)),
  bonus: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
});

const weaponOffenseBuffSchema = damageOffenseBuffSchema.extend
({
  criticalPower: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
  criticalRange: numberInput(z.coerce.number<number>().int().min(-100).max(100)),
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