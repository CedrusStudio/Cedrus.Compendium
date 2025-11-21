/**
 * Tag must be a lowercase single-word string (no spaces, no uppercase)
 */
export type Tag = string;

export function isValidTag(value: string): value is Tag 
{
  return value === value.toLowerCase() && !value.includes(' ');
}

export const CharacterTag = 'postać';
export const SessionTagPrefix = 'sesja-';

export function isCharacterOrSessionTag(tag: Tag): boolean
{
  return tag === CharacterTag || tag.startsWith(SessionTagPrefix);
}