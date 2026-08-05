import { SheetHeader } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";

/**
 * The free-text description sits near the bottom and can be switched off.
 *
 * It is the one block on the sheet nobody consults mid-turn — appearance notes,
 * backstory, house-ruled reminders — and on a player character it easily runs to
 * twenty lines. Keeping it above the combat numbers pushed everything useful
 * down the page.
 */
export default function DescriptionSection({ header }: { header: SheetHeader })
{
  if (!header.description) return null;

  return (
    <SheetSection title="opis">
      <p className={header.descriptionIsLong ? "sheet-description sheet-columns-2" : "sheet-description"}>
        {header.description}
      </p>
    </SheetSection>
  );
};
