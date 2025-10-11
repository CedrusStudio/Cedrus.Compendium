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