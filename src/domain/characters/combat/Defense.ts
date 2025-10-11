export type Defense = 
{
  readonly id: string;
  name: string;
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

export function reductionSelectFilter(selectedReductionType: ReductionType): (name: string) => boolean
{
  if (selectedReductionType === "full") return fullFilter;
  if (selectedReductionType === "block") return blockFilter;
  if (selectedReductionType === "direct") return directFilter;
  throw new Error("Invalid reduction type");
}

function fullFilter(name: string): boolean 
{
  return name !== "immunity" 
    && name !== "resistance"
    && name !== "name"
    && name !== "description"
    && name !== "id";
} 

function blockFilter(name: string): boolean 
{
  return fullFilter(name) && name !== "dodge" && name !== "parry";
} 

function directFilter(name: string): boolean 
{
  return blockFilter(name) && name !== "block";
}

export const pathToDefenseField = <K extends keyof Defense>(index: number, field: K): `defenses.${number}.${K}` => `defenses.${index}.${field}`;
