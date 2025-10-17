import { type CastTime } from '@/domain/characters/Castable';

export const colors = 
{
  text: {
    below: 'text-red-500',
    above: 'text-green-500'
  },
  offense: {
    leading: 'text-yellow-400',
    secondary: 'text-blue-400',
  }
} as const;

export const getColorTextChange = (value: number, defaultValue: number) => value < defaultValue 
  ? colors.text.below 
  : value > defaultValue 
    ? colors.text.above : '';

export const castTimeColorClasses: Record<CastTime, { text: string; bg: string }> = 
{
  "Pełnorundowa": { text: "text-blue-400", bg: "bg-blue-600" },
  "Standardowa": { text: "text-green-500", bg: "bg-green-700" },
  "Natychmiastowa": { text: "text-gray-400", bg: "bg-gray-600" },
  "Nadnatychmiastowa": { text: "text-rose-400", bg: "bg-rose-600" },
};

export const getCastTimeColors = (castTime: CastTime) => 
{
  return castTimeColorClasses[castTime] ?? { text: "text-gray-500", bg: "bg-gray-500" };
};

type BadgeActionVariant = "full" | "standard" | "immediate" | "overimmediate" | null | undefined

export function getBadgeVariant(castTime: CastTime): BadgeActionVariant
{
  if (castTime === "Pełnorundowa") return "full";
  if (castTime === "Standardowa") return "standard";
  if (castTime === "Natychmiastowa") return "immediate";
  if (castTime === "Nadnatychmiastowa") return "overimmediate";
  return null;
}