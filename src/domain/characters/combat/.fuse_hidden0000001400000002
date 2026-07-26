export const spellCostScalingModes = ['fixed', 'multiply', 'divide'] as const;
export type SpellCostScalingMode = typeof spellCostScalingModes[number];

export const spellCostRoundings = ['floor', 'ceil', 'round'] as const;
export type SpellCostRounding = typeof spellCostRoundings[number];

export type SpellCost =
{
  baseCost: number;
  scalingMode: SpellCostScalingMode;
  scalingValue: number;
  rounding: SpellCostRounding;
};

export type SpellCostPersistenceFields =
{
  cost: number;
  costBase?: number | null;
  costScalingMode?: string | null;
  costScalingValue?: number | null;
  costRounding?: string | null;
};

export type NormalizedSpellCostPersistenceFields =
{
  cost: number;
  costBase: number;
  costScalingMode: SpellCostScalingMode;
  costScalingValue: number;
  costRounding: SpellCostRounding;
};

export const spellCostPreviewStrengths = [1, 5, 10] as const;

type SpellCostInput =
  | SpellCost
  | number
  | null
  | undefined
  | {
      baseCost?: number | string | null;
      scalingMode?: string | null;
      scalingValue?: number | string | null;
      rounding?: string | null;
    };

export const defaultSpellCost: SpellCost =
{
  baseCost: 20,
  scalingMode: 'fixed',
  scalingValue: 1,
  rounding: 'floor',
};

export function createFixedSpellCost(baseCost: number): SpellCost
{
  return {
    ...defaultSpellCost,
    baseCost,
  };
}

export function normalizeSpellCost(rawCost: SpellCostInput): SpellCost
{
  if (typeof rawCost === 'number')
  {
    return createFixedSpellCost(rawCost);
  }

  if (!rawCost)
  {
    return defaultSpellCost;
  }

  return {
    baseCost: normalizeSpellCostNumber(rawCost.baseCost, defaultSpellCost.baseCost),
    scalingMode: normalizeSpellCostScalingMode(rawCost.scalingMode),
    scalingValue: normalizeSpellCostNumber(rawCost.scalingValue, defaultSpellCost.scalingValue),
    rounding: normalizeSpellCostRounding(rawCost.rounding),
  };
}

export function fromSpellCostPersistence(rawCost: SpellCostPersistenceFields): SpellCost
{
  return normalizeSpellCost({
    baseCost: rawCost.costBase ?? rawCost.cost,
    scalingMode: normalizeSpellCostScalingMode(rawCost.costScalingMode),
    scalingValue: rawCost.costScalingValue ?? defaultSpellCost.scalingValue,
    rounding: normalizeSpellCostRounding(rawCost.costRounding),
  });
}

export function toSpellCostPersistence(spellCost: SpellCost | number): NormalizedSpellCostPersistenceFields
{
  const normalizedCost = normalizeSpellCost(spellCost);

  return {
    cost: normalizedCost.baseCost,
    costBase: normalizedCost.baseCost,
    costScalingMode: normalizedCost.scalingMode,
    costScalingValue: normalizedCost.scalingValue,
    costRounding: normalizedCost.rounding,
  };
}

export function calculateSpellCost(spellCost: SpellCostInput, spellStrength: number): number
{
  const normalizedCost = normalizeSpellCost(spellCost);

  if (normalizedCost.scalingMode === 'fixed')
  {
    return normalizedCost.baseCost;
  }

  if (normalizedCost.scalingMode === 'multiply')
  {
    return normalizedCost.baseCost + normalizedCost.scalingValue * spellStrength;
  }

  const scaledValue = applyRounding(spellStrength / normalizedCost.scalingValue, normalizedCost.rounding);
  return normalizedCost.baseCost + scaledValue;
}

export function formatSpellCost(spellCost: SpellCostInput): string
{
  const normalizedCost = normalizeSpellCost(spellCost);

  if (normalizedCost.scalingMode === 'fixed')
  {
    return String(normalizedCost.baseCost);
  }

  if (normalizedCost.scalingMode === 'multiply')
  {
    const scaleText = normalizedCost.scalingValue === 1 ? 'SZ' : `${normalizedCost.scalingValue}×SZ`;
    return `${normalizedCost.baseCost} + ${scaleText}`;
  }

  const divisionText = normalizedCost.scalingValue === 1 ? 'SZ' : `SZ / ${normalizedCost.scalingValue}`;
  return `${normalizedCost.baseCost} + ${normalizedCost.rounding}(${divisionText})`;
}

function applyRounding(value: number, rounding: SpellCostRounding): number
{
  switch (rounding)
  {
    case 'ceil':
      return Math.ceil(value);
    case 'round':
      return Math.round(value);
    case 'floor':
    default:
      return Math.floor(value);
  }
}

function normalizeSpellCostNumber(rawValue: number | string | null | undefined, fallback: number): number
{
  if (typeof rawValue === 'number' && Number.isFinite(rawValue))
  {
    return rawValue;
  }

  if (typeof rawValue === 'string')
  {
    const normalizedValue = rawValue.trim();

    if (normalizedValue.length === 0)
    {
      return fallback;
    }

    const parsedValue = Number(normalizedValue);

    if (Number.isFinite(parsedValue))
    {
      return parsedValue;
    }
  }

  return fallback;
}

function normalizeSpellCostScalingMode(rawMode: string | null | undefined): SpellCostScalingMode
{
  if (rawMode && spellCostScalingModes.includes(rawMode as SpellCostScalingMode))
  {
    return rawMode as SpellCostScalingMode;
  }

  return defaultSpellCost.scalingMode;
}

function normalizeSpellCostRounding(rawRounding: string | null | undefined): SpellCostRounding
{
  if (rawRounding && spellCostRoundings.includes(rawRounding as SpellCostRounding))
  {
    return rawRounding as SpellCostRounding;
  }

  return defaultSpellCost.rounding;
}