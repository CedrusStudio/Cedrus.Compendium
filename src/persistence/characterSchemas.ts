import { z } from "zod";

// Schema for character header (name and description)
export const upsertCharacterHeaderSchema = z.object
({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    description: z.string()
        .min(2, { message: "Description must be at least 2 characters." })
        .max(600, { message: "Description must not be longer than 600 characters." }),
});

export type UpsertCharacterHeaderType = z.infer<typeof upsertCharacterHeaderSchema>;

// New schema for character statistics
export const statisticSchema = z.object
({
  grade: z.number().min(1, { message: "Grade must be at least 1." }).max(50, { message: "Grade must be at most 50." }),
  value: z.number().min(-10, { message: "Value must be at least -10." }).max(25, { message: "Value must be at most 25." }),
  bonus: z.number().min(-10, { message: "Bonus must be at least -10." }).max(20, { message: "Bonus must be at most 20." }),
  testBonus: z.number().min(-10, { message: "Test bonus must be at least -10." }).max(20, { message: "Test bonus must be at most 20." }),
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

// export type CharacterStatisticType = z.infer<typeof characterCharacteristicsSchema> | z.infer<typeof characterAttributesSchema>;
export type UpsertCharacterStatisticsType = z.infer<typeof upsertCharacterStatisticsSchema>;