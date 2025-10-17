import { Entity } from "@/domain/Entity";
import { ulid } from "ulid";

export type Defense = Entity &
{
  description?: string;
  immunity: number;
  resistance: number;
  protection: number;
  block: number;
  parry: number;
  dodge: number;
  bonus: number;
};

export type ReductionType = typeof allowedReductionTypes[number];
export const allowedReductionTypes = ["full", "block", "direct"] as const satisfies readonly string[];
export const pathToDefenseField = <K extends keyof Defense>(index: number, field: K): `defenses.${number}.${K}` => `defenses.${index}.${field}`;

export function calculateSelectedReduction(defense: Defense, selectedReductionType: ReductionType): number 
{
  if (selectedReductionType === "full") 
  {
    return defense.block + defense.parry + defense.dodge + defense.bonus + defense.protection;
  }

  if (selectedReductionType === "block") 
  {
    return defense.block + defense.bonus + defense.protection;
  }

  if (selectedReductionType === "direct") 
  {
    return defense.bonus + defense.protection;
  }

  throw new Error("Invalid reduction type");
}

export function filteredDefenseKeys(defense: Defense, selectedReductionType: ReductionType): (keyof Defense)[]
{
  return (Object.keys(defense) as (keyof Defense)[])
    .filter(name => reductionSelectFilter(selectedReductionType)(name));
}

function reductionSelectFilter(selectedReductionType: ReductionType): (name: keyof Defense) => boolean
{
  if (selectedReductionType === "full") return fullFilter;
  if (selectedReductionType === "block") return blockFilter;
  if (selectedReductionType === "direct") return directFilter;
  throw new Error("Invalid reduction type");
}

function fullFilter(name: keyof Defense): boolean 
{
  return name !== "immunity" 
    && name !== "resistance"
    && name !== "name"
    && name !== "description"
    && name !== "id";
} 

function blockFilter(name: keyof Defense): boolean 
{
  return fullFilter(name) && name !== "dodge" && name !== "parry";
} 

function directFilter(name: keyof Defense): boolean 
{
  return blockFilter(name) && name !== "block";
}

const defaultDefense: Omit<Defense, "id"> =
{
  name: "Nowa Defensywa",
  description: "Opis defensywy",
  immunity: 0,
  resistance: 0,
  protection: 0,
  block: 0,
  parry: 0,
  dodge: 0,
  bonus: 0
};

export const CreateDefaultDefense = (): Defense => ({...defaultDefense, id: ulid()});