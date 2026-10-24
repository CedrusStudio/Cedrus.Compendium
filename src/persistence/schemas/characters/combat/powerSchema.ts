import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { acceptedPowerTypes, normalizePowerType } from "@/domain/characters/combat/Power";
import { spellCostRoundings, spellCostScalingModes } from "@/domain/characters/combat/SpellCost";
import { perkSchema } from "@/persistence/schemas/characters/perkSchema";
import { castableSchema } from "@/persistence/schemas/characters/castableSchema";
import { entitySchema } from "@/persistence/schemas/entitySchema";
import { weaponOffenseSchema, damageOffenseSchema } from "@/persistence/schemas/characters/combat/offenseSchema";
import { tagsSchema } from "@/persistence/schemas/tagSchema";

const powerTypeSchema = z.enum(acceptedPowerTypes).transform(normalizePowerType);
const spellCostValueSchema = numberInput(z.coerce.number<number>().int().min(0, { message: "Koszt musi mieć co najmniej 0." }).max(1000, { message: "Koszt musi być najwyżej 1000." }));

export const spellCostSchema = z.object
({
  baseCost: spellCostValueSchema,
  scalingMode: z.enum(spellCostScalingModes),
  scalingValue: numberInput(z.coerce.number<number>().int().min(1, { message: "Wartość skali musi mieć co najmniej 1." }).max(100, { message: "Wartość skali musi być najwyżej 100." })),
  rounding: z.enum(spellCostRoundings),
});

export const spellSchema = perkSchema.extend
({
  ...castableSchema.shape,
  cost: spellCostSchema,
});

export const addSpellSchema = spellSchema.omit({ id: true });

export const powerOffenseSchema = z.object
({
  spellOffense: weaponOffenseSchema,
  spellDamage: damageOffenseSchema,
  description: z.string().min(0).max(2000, { message: "Opis może mieć maksymalnie 2000 znaków." }),
  cost: numberInput(z.coerce.number<number>().int().min(0, { message: "Koszt musi mieć co najmniej 0." }).max(1000, { message: "Koszt musi być najwyżej 1000." }))
});

export const powerSpecificationSchema = entitySchema.extend
({
  description: z.string().min(0).max(2000, { message: "Opis może mieć maksymalnie 2000 znaków." }),
  tags: tagsSchema,
  offenses: z.array(powerOffenseSchema).max(20, { message: "Możesz mieć najwyżej 20 ofensyw mocy." })
});

export const addPowerSpecificationSchema = powerSpecificationSchema.omit({ id: true });

export const powerSchema = entitySchema.extend
({
  type: powerTypeSchema,
  level: numberInput(z.coerce.number<number>().int().min(0, { message: "Poziom musi mieć co najmniej 0." }).max(20, { message: "Poziom musi być najwyżej 20." })),
  bonus: numberInput(z.coerce.number<number>().int().min(0, { message: "Bonus musi mieć co najmniej 0." }).max(10, { message: "Bonus musi mieć najwyżej 10." })),
  essence: numberInput(z.coerce.number<number>().int().min(0, { message: "Esencja musi mieć co najmniej 0." }).max(15_000, { message: "Esencja musi mieć najwyżej 15000." })),
  description: z.string().min(0).max(2000, { message: "Opis może mieć maksymalnie 2000 znaków." }),
  spells: z.array(spellSchema).max(100, { message: "Możesz mieć najwyżej 100 zaklęć." }),
  powerSpecificationId: z.string().min(1, { message: "Musisz wybrać specyfikację mocy." })
});

export const powersSchema = z.array(powerSchema).max(100, { message: "Możesz mieć najwyżej 100 mocy." });

const formulaFieldSchema = z.string()
  .max(100, { message: "Formuła może mieć maksymalnie 100 znaków." })
  .regex(/^[0-9xXk\s+\-*/().]*$/, { message: "Dozwolone znaki: cyfry, x, k, +, −, *, /, (, )." });

export const powerOffenseFormulaSchema = z.object
({
  count: numberInput(z.coerce.number<number>().int().min(1, { message: "Liczba ofensyw musi wynosić co najmniej 1." }).max(20, { message: "Liczba ofensyw musi wynosić najwyżej 20." })),

  offenseAmountFormula: formulaFieldSchema,
  offenseGradeFormula: formulaFieldSchema,
  offenseBonusFormula: formulaFieldSchema,
  offenseIsPhantom: z.boolean(),
  offenseCriticalPowerFormula: formulaFieldSchema,
  offenseCriticalRangeFormula: formulaFieldSchema,

  damageAmountFormula: formulaFieldSchema,
  damageGradeFormula: formulaFieldSchema,
  damageBonusFormula: formulaFieldSchema,
  damageIsPhantom: z.boolean(),

  costFormula: formulaFieldSchema,

  descriptionPrefix: z.string().max(200, { message: "Prefiks opisu może mieć maksymalnie 200 znaków." }),
});

export type SpellDto = z.infer<typeof spellSchema>;
export type AddSpellDto = z.infer<typeof addSpellSchema>;
export type SpellCostDto = z.infer<typeof spellCostSchema>;
export type PowerDto = z.infer<typeof powerSchema>;
export type PowerSpecificationDto = z.infer<typeof powerSpecificationSchema>;
export type AddPowerSpecificationDto = z.infer<typeof addPowerSpecificationSchema>;
export type PowerOffenseFormulaDto = z.infer<typeof powerOffenseFormulaSchema>;