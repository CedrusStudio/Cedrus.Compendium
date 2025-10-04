export type CastTime = "Pełnorundowa" | "Standardowa" | "Natychmiastowa" | "Nadnatychmiastowa";

export const castTimeValues = [
  "Pełnorundowa",
  "Standardowa",
  "Natychmiastowa",
  "Nadnatychmiastowa",
] as const satisfies readonly CastTime[];

export const castTimeTranslations: Record<CastTime, string> = 
{
  "Pełnorundowa": "full",
  "Standardowa": "standard",
  "Natychmiastowa": "immediate",
  "Nadnatychmiastowa": "overimmediate",
};

export const castTimeColorClasses: Record<CastTime, { text: string; bg: string }> = 
{
  "Pełnorundowa": { text: "text-blue-400", bg: "bg-blue-600" },
  "Standardowa": { text: "text-green-500", bg: "bg-green-700" },
  "Natychmiastowa": { text: "text-gray-400", bg: "bg-gray-600" },
  "Nadnatychmiastowa": { text: "text-rose-400", bg: "bg-rose-600" },
};

export const getColorClasses = (castTime: CastTime) => 
{
  return castTimeColorClasses[castTime] ?? { text: "text-gray-500", bg: "bg-gray-500" };
};