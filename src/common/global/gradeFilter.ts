export const MIN_GRADE_FILTER = 0;
export const MAX_GRADE_FILTER = 15;

export function normalizeGradeFilterInput(rawValue: string): string
{
  const trimmedValue = rawValue.trim();

  if (!trimmedValue)
  {
    return "";
  }

  const parsedValue = Number(trimmedValue);

  if (!Number.isFinite(parsedValue))
  {
    return "";
  }

  const clampedValue = Math.min(
    Math.max(Math.trunc(parsedValue), MIN_GRADE_FILTER),
    MAX_GRADE_FILTER,
  );

  return String(clampedValue);
}

export function parseGradeFilterInput(value: string | undefined): number | undefined
{
  if (!value)
  {
    return undefined;
  }

  return Number(value);
}