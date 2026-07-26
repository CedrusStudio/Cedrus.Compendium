/**
 * "Zastępuje X" parsing (ROADMAP 8.6).
 *
 * The library authored replacement notes as requirement texts. A replacement is
 * a relation between two entities — it says nothing about the character — so it
 * belongs in the `replaces` field, not among requirements. Pure and separate
 * from the migration script so it can be unit-tested.
 */

/** "Zastępuje Młyniec" → "Młyniec". Anything else → `undefined`. */
export function replacedEntityName(text: string): string | undefined
{
  const match = text.match(/^\s*zast[ęe]puje\s+(.+)$/i);
  if (!match)
  {
    return undefined;
  }

  const name = match[1]!.trim();
  return name.length > 0 ? name : undefined;
}
