import { Character } from "@/domain/characters/Character";
import { Statistic } from "@/domain/characters/statistics/Statistic";

export type Health = 
{
  barrier: number;
  vitality: number;
  toughness: number;
  recoveryLevel: number;
  lethalHealth: number;
  lethalRounds: number;
  bonus: number;
};

export function calculateTotalHealthForCharacter(character: Character): number
{
  return character.health.vitality 
    + character.health.toughness * character.characteristics.constitution.value
    + character.characteristics.constitution.bonus 
    + character.attributes.fortitude.value
    + character.attributes.fortitude.bonus
    + character.health.bonus;
}

export function calculateTotalHealth(health: Health, constitution: Statistic, fortitude: Statistic): number
{
  return health.vitality 
    + health.toughness * constitution.value
    + constitution.bonus 
    + fortitude.value
    + fortitude.bonus
    + health.bonus;
}


