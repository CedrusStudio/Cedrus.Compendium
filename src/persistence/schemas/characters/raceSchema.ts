import { numberInput } from "@/persistence/schemas/numericSchema";
import { z } from "zod";
import { entitySchema } from "@/persistence/schemas/entitySchema";
import { tagsSchema } from "@/persistence/schemas/tagSchema";

export const raceSchema = entitySchema.extend
({
  description: z.string().min(0).max(1000, { message: "Opis musi mieć najwyżej 1000 znaków." }),
  tags: tagsSchema,
  strengthModifier: numberInput(z.coerce.number<number>().int().min(-5, { message: "Modyfikator siły musi być co najmniej -5." }).max(20, { message: "Modyfikator siły musi być najwyżej 20." })).default(0),
  dexterityModifier: numberInput(z.coerce.number<number>().int().min(-5, { message: "Modyfikator zręczności musi być co najmniej -5." }).max(20, { message: "Modyfikator zręczności musi być najwyżej 20." })).default(0),
  constitutionModifier: numberInput(z.coerce.number<number>().int().min(-5, { message: "Modyfikator kondycji musi być co najmniej -5." }).max(20, { message: "Modyfikator kondycji musi być najwyżej 20." })).default(0),
  mindModifier: numberInput(z.coerce.number<number>().int().min(-5, { message: "Modyfikator umysłu musi być co najmniej -5." }).max(20, { message: "Modyfikator umysłu musi być najwyżej 20." })).default(0),
  charismaModifier: numberInput(z.coerce.number<number>().int().min(-5, { message: "Modyfikator charyzmy musi być co najmniej -5." }).max(20, { message: "Modyfikator charyzmy musi być najwyżej 20." })).default(0),
  spellbornModifier: numberInput(z.coerce.number<number>().int().min(-5, { message: "Modyfikator czarokrwistości musi być co najmniej -5." }).max(20, { message: "Modyfikator czarokrwistości musi być najwyżej 20." })).default(0)
});

export const addRaceSchema = raceSchema.omit({ id: true });

export const racesSchema = z.array(raceSchema).max(100, { message: "Możesz mieć najwyżej 100 ras." });

export type RaceDto = z.infer<typeof raceSchema>;
export type AddRaceDto = z.infer<typeof addRaceSchema>;
