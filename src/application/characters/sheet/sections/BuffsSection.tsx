import { SheetBuffLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";

/**
 * Which profiles produced the numbers above, and by how much.
 *
 * The statistics on the sheet already include these deltas — the sheet mirrors
 * what the app shows for the same character. This table exists so the reader can
 * tell which part of a number is permanent and which comes from a stance that
 * happens to be switched on.
 */
export default function BuffsSection({ buffs }: { buffs: SheetBuffLine[] })
{
  if (buffs.length === 0) return null;

  return (
    <SheetSection title="aktywne wzmocnienia" note="już wliczone w wartości powyżej">
      <SheetTable headers={["profil", "źródło", "zmiany"]}>
        {
          buffs.map(buff => (
            <tr key={buff.id}>
              <td className="is-name">{buff.name}</td>
              <td className="sheet-muted">{buff.source}</td>
              <td className="is-summary">{buff.changes.join(" · ")}</td>
            </tr>
          ))
        }
      </SheetTable>
    </SheetSection>
  );
};
