/**
 * Tag must be a lowercase single-word string (no spaces, no uppercase)
 */
export type Tag = string;

export function isValidTag(value: string): value is Tag 
{
  return value === value.toLowerCase() && !value.includes(' ');
}