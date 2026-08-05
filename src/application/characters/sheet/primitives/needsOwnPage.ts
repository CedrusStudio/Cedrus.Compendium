/**
 * Whether a reference block (ekwipunek, moce, umiejętności) is big enough to
 * deserve a page of its own.
 *
 * Those three sections are allowed to spill onto separate pages so the combat
 * sheet stays within two — but 95% of the records in the database are NPC
 * templates with a single armour or a handful of talents, and giving those a
 * dedicated page wastes paper without helping anyone. Below the threshold the
 * block simply flows after the notes; it is far too small to push the sheet
 * over budget.
 */
export const ownPageThreshold = 12;

export function needsOwnPage(entryCount: number): boolean
{
  return entryCount > ownPageThreshold;
}
