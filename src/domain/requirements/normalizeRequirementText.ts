/**
 * Canonical normalizer for free-text requirements (Wave 5, 5.2).
 *
 * Used in two places so they never drift:
 *  - on save (form validation / backfill), to store a normalized `rankless`
 *    text, and
 *  - in the comparison engine, so "Siła 3" and "siła   3" collapse to the same
 *    value when matched against owned entity names.
 *
 * Deliberately shallow: trim, lowercase, collapse internal whitespace. It does
 * NOT strip punctuation or diacritics — Polish entity names ("Zapał Wojownika")
 * must round-trip losslessly for the name match to work.
 */
export function normalizeRequirementText(text: string): string
{
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}
