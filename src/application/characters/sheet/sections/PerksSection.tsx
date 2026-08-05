import { SheetActionLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";

/**
 * Two columns rather than a table: atuty are passive and rarely consulted
 * mid-turn, and a character can easily carry thirty of them. Their summaries are
 * cut shorter than everything else (`summaryLengths.perk`) so each entry stays
 * on one line and the block costs half the rows a full-width table would.
 */
export default function PerksSection({ perks }: { perks: SheetActionLine[] })
{
  if (perks.length === 0) return null;

  return (
    <SheetSection title="atuty" note={`${perks.length}`}>
      <div className="sheet-columns-2">
        {
          perks.map(perk => (
            <div key={perk.id} className="sheet-compact-entry">
              <b>{perk.name}</b>
              <span className="sheet-muted">{` (${perk.grade}) `}</span>
              {perk.summary}
            </div>
          ))
        }
      </div>
    </SheetSection>
  );
};
