import { ulid } from "ulid";

export type Maneuver =
{
  readonly id: string;
  name: string;
  grade: number;
  description: string;
  cooldown?: number;
  castTime: CastTime;
};

export type CastTime = "Pełnorundowa" | "Standardowa" | "Natychmiastowa" | "Nadnatychmiastowa";

export const allowedCastTimes = [
  "Pełnorundowa",
  "Standardowa",
  "Natychmiastowa",
  "Nadnatychmiastowa",
] as const satisfies readonly CastTime[];

export type EndTurn = "end";
type ActionCounts = { full: number; standard: number; immediate: number; overimmediate: number };
type AllowedManeuverCombination = Readonly<ActionCounts>;

const MANEUVER_COMBINATION_PROFILES: readonly AllowedManeuverCombination[] = 
[
  { full: 0, standard: 0, immediate: 0, overimmediate: 3 },
  { full: 0, standard: 0, immediate: 2, overimmediate: 1 },
  { full: 0, standard: 1, immediate: 1, overimmediate: 1 },
  { full: 0, standard: 1, immediate: 0, overimmediate: 2 },
  { full: 1, standard: 0, immediate: 0, overimmediate: 1 },
] as const;

const fitsProfile = (counts: ActionCounts, allowedCombinations: AllowedManeuverCombination) => 
     counts.full <= allowedCombinations.full 
  && counts.standard <= allowedCombinations.standard 
  && counts.immediate <= allowedCombinations.immediate 
  && counts.overimmediate <= allowedCombinations.overimmediate;

export function canUseManeuver(maneuver: Maneuver, usedManeuvers: (Maneuver | EndTurn)[]): boolean
{
  if (usedManeuvers.length === 0) return true;
  const maneuversInCurrentTurn = getManeuversInCurrentTurn(usedManeuvers);
  if (usedInCurrentTurn(maneuversInCurrentTurn, maneuver.name)) return false;
  if (onCooldown(usedManeuvers, maneuver, maneuver.name)) return false;
  return canUseCastTime(maneuversInCurrentTurn, maneuver.castTime);
}

function getManeuversInCurrentTurn(usedManeuvers: (Maneuver | EndTurn)[]): Maneuver[]
{
  return usedManeuvers.slice(usedManeuvers.lastIndexOf("end") + 1) as Maneuver[];
}

function usedInCurrentTurn(maneuversInCurrentTurn: Maneuver[], name: string): boolean
{
  return maneuversInCurrentTurn.some(x => x.name === name);
}

function onCooldown(usedManeuvers: (Maneuver | EndTurn)[], maneuver: Maneuver, name: string): boolean
{
  const lastUsedIndex = usedManeuvers.findLastIndex(x => (x !== "end" && x.name === name));
  if (lastUsedIndex === -1) return false;
  if (!maneuver.cooldown) return true;
  const turnCountSinceLastUse = usedManeuvers.slice(lastUsedIndex).filter(x => x === "end").length;
  return turnCountSinceLastUse < maneuver.cooldown;
}

const canUseCastTime = (used: Maneuver[], next: CastTime) => 
{
  const counts = calculateCountActions(used);
  const key = castKey(next);
  return MANEUVER_COMBINATION_PROFILES.some(profile => fitsProfile(counts, profile) && (counts[key] + 1) <= profile[key]);
};

const calculateCountActions = (maneuvers: Maneuver[]): ActionCounts => maneuvers.reduce<ActionCounts>((counts, maneuver) => 
{
  counts[castKey(maneuver.castTime)] += 1;
  return counts;
}, { full: 0, standard: 0, immediate: 0, overimmediate: 0 });

const castKey = (ct: CastTime): keyof ActionCounts =>
  ct === "Pełnorundowa" 
    ? "full" : ct === "Standardowa" 
      ? "standard" : ct === "Natychmiastowa" 
        ? "immediate" : "overimmediate";

export const defaultManeuver: Omit<Maneuver, "id"> =
{ 
  name: 'Manewr', 
  description: 'Opis manewru', 
  grade: 1, 
  castTime: "Standardowa", 
  cooldown: 1 
};

export const CreateDefaultManeuver = (): Maneuver => ({...defaultManeuver, id: ulid()});