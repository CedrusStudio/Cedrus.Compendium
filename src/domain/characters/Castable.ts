import { Entity } from "@/domain/Entity";

export type Castable = Entity &
{
  castTime: CastTime;
  cooldown?: number;
}

export type CastTime = "Pełnorundowa" | "Standardowa" | "Natychmiastowa" | "Nadnatychmiastowa";

export const allowedCastTimes = [
  "Pełnorundowa",
  "Standardowa",
  "Natychmiastowa",
  "Nadnatychmiastowa",
] as const satisfies readonly CastTime[];

export type EndTurn = "end";
type ActionCounts = { full: number; standard: number; immediate: number; overimmediate: number };
type AllowedCastableCombination = Readonly<ActionCounts>;
type CurrentTurnUsageRule = (castablesInCurrentTurn: Castable[], castable: Castable) => boolean;

const CASTABLE_COMBINATION_PROFILES: readonly AllowedCastableCombination[] = 
[
  { full: 0, standard: 0, immediate: 0, overimmediate: 3 },
  { full: 0, standard: 0, immediate: 2, overimmediate: 1 },
  { full: 0, standard: 1, immediate: 1, overimmediate: 1 },
  { full: 0, standard: 1, immediate: 0, overimmediate: 2 },
  { full: 1, standard: 0, immediate: 0, overimmediate: 1 },
] as const;

const fitsProfile = (counts: ActionCounts, allowedCombinations: AllowedCastableCombination) => 
     counts.full <= allowedCombinations.full 
  && counts.standard <= allowedCombinations.standard 
  && counts.immediate <= allowedCombinations.immediate 
  && counts.overimmediate <= allowedCombinations.overimmediate;

export function canUseCastable(castable: Castable, usedCastables: (Castable | EndTurn)[]): boolean
{
  return canUseCastableByRule(castable, usedCastables,
    (castablesInCurrentTurn, nextCastable) => canUseCastTime(castablesInCurrentTurn, nextCastable.castTime));
}

export function canUseSpell(castable: Castable, usedCastables: (Castable | EndTurn)[]): boolean
{
  return canUseCastableByRule(castable, usedCastables, () => true);
}

function canUseCastableByRule(castable: Castable, usedCastables: (Castable | EndTurn)[], currentTurnUsageRule: CurrentTurnUsageRule): boolean
{
  if (usedCastables.length === 0) return true;
  const castablesInCurrentTurn = getCastablesInCurrentTurn(usedCastables);
  if (usedInCurrentTurn(castablesInCurrentTurn, castable.name)) return false;
  if (onCooldown(usedCastables, castable, castable.name)) return false;
  return currentTurnUsageRule(castablesInCurrentTurn, castable);
}

function getCastablesInCurrentTurn(usedCastables: (Castable | EndTurn)[]): Castable[]
{
  return usedCastables.slice(usedCastables.lastIndexOf("end") + 1) as Castable[];
}

function usedInCurrentTurn(castablesInCurrentTurn: Castable[], name: string): boolean
{
  return castablesInCurrentTurn.some(x => x.name === name);
}

function onCooldown(usedCastables: (Castable | EndTurn)[], castable: Castable, name: string): boolean
{
  const lastUsedIndex = usedCastables.findLastIndex(x => (x !== "end" && x.name === name));
  if (lastUsedIndex === -1) return false;
  if (!castable.cooldown) return true;
  const turnCountSinceLastUse = usedCastables.slice(lastUsedIndex).filter(x => x === "end").length;
  return turnCountSinceLastUse < castable.cooldown;
}

const canUseCastTime = (used: Castable[], next: CastTime) => 
{
  const counts = calculateCountActions(used);
  const key = castKey(next);
  return CASTABLE_COMBINATION_PROFILES.some(profile => fitsProfile(counts, profile) && (counts[key] + 1) <= profile[key]);
};

const calculateCountActions = (castables: Castable[]): ActionCounts => castables.reduce<ActionCounts>((counts, castable) => 
{
  counts[castKey(castable.castTime)] += 1;
  return counts;
}, { full: 0, standard: 0, immediate: 0, overimmediate: 0 });

const castKey = (ct: CastTime): keyof ActionCounts =>
  ct === "Pełnorundowa" 
    ? "full" : ct === "Standardowa" 
      ? "standard" : ct === "Natychmiastowa" 
        ? "immediate" : "overimmediate";
