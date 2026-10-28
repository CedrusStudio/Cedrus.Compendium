import { SheetPowerBlock } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";
import { shortCastTime } from "@/application/characters/sheet/sections/ActionsSection";
import { needsOwnPage } from "@/application/characters/sheet/primitives/needsOwnPage";

/**
 * Moce i zaklęcia get their own page: a caster's spell list is the one block
 * that reliably outgrows everything else, and splitting it across the combat
 * page makes both harder to scan.
 */
export default function PowersSection({ powers }: { powers: SheetPowerBlock[] })
{
  if (powers.length === 0) return null;

  const entryCount = powers.reduce((count, power) => count + power.spells.length + 3, 0);

  return (
    <SheetSection title="moce i zaklęcia" pageBreak={needsOwnPage(entryCount)} note="SZ = siła zaklęcia">
      {
        powers.map(power => (
          <div key={power.id} style={{ marginBottom: "3mm" }}>

            <h3 className="sheet-subheading">
              {power.name}
              <span className="sheet-muted" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                {` — ${power.type}, poziom ${power.level}${power.bonus !== 0 ? `, bonus ${power.bonus}` : ""}, esencja ${power.essence}`}
              </span>
            </h3>

            {power.summary && <p className="sheet-muted" style={{ margin: "0 0 1mm" }}>{power.summary}</p>}

            {
              power.spells.length > 0 && (
                <div style={{ marginTop: "1.2mm" }}>
                  <SheetTable headers={["zaklęcie", "ranga", "czas", "koszt", "efekt"]}>
                    {
                      power.spells.map(spell => (
                        <tr key={spell.id}>
                          <td className="is-name">{spell.name}</td>
                          <td className="is-numeric">{spell.grade}</td>
                          <td>{shortCastTime(spell.castTime)}</td>
                          <td className="is-numeric">{spell.cost}</td>
                          <td className="is-summary">{spell.summary}</td>
                        </tr>
                      ))
                    }
                  </SheetTable>
                </div>
              )
            }

          </div>
        ))
      }
    </SheetSection>
  );
};
