import { Statistic } from "@/domain/characters/statistics/Statistic";

export type Characteristics = 
{
  strength: Statistic;
  dexterity: Statistic;
  constitution: Statistic;
  mind: Statistic;
  charisma: Statistic;
  spellborn: Statistic;
};

export const allowedCharacteristics =
[
  "siła",
  "zręczność",
  "budowa",
  "umysł",
  "charyzma",
  "czarokrwistość"
] as const satisfies readonly string[];