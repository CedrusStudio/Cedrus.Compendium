import { Statistic } from "@/domain/characters/statistics/Statistic";

export type Attributes =
{
  fencing: Statistic;
  artifice: Statistic;
  precision: Statistic;
  initiative: Statistic;
  martialArt: Statistic;
  horsemanship: Statistic;

  fortitude: Statistic;
  reflex: Statistic;
  willpower: Statistic;
};

export function rollInitiative(initiative: Statistic): number 
{
  return rollInitiativeBase(initiative.grade, initiative.value, initiative.bonus, initiative.testBonus);
}

export function rollInitiativeBase(grade: number, value: number, bonus: number, testBonus: number): number 
{
  const diceRoll = Math.floor(Math.random() * grade * 2) + 1;
  return diceRoll + value + bonus + testBonus;
}
