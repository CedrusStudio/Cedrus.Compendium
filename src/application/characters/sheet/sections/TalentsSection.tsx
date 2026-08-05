import { SheetTalentGroup } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import { needsOwnPage } from "@/application/characters/sheet/primitives/needsOwnPage";

/**
 * Umiejętności get their own page and a three-column layout: they are a long,
 * flat, alphabetical list that nobody reads mid-turn, so they cost the least by
 * being dense and far from the combat block.
 */
export default function TalentsSection({ groups }: { groups: SheetTalentGroup[] })
{
  if (groups.length === 0) return null;

  const total = groups.reduce((count, group) => count + group.talents.length, 0);

  return (
    <SheetSection title="umiejętności" pageBreak={needsOwnPage(total)} note={`${total}`}>
      <div className="sheet-columns-3">
        {
          groups.map(group => (
            <div key={group.category} style={{ marginBottom: "2mm" }}>
              <h3 className="sheet-subheading" style={{ marginTop: 0 }}>{group.category}</h3>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {
                  group.talents.map(talent => (
                    <li
                      key={talent.id}
                      style={{ display: "flex", justifyContent: "space-between", gap: "2mm", borderBottom: "0.3pt dotted #bbb" }}
                    >
                      <span>
                        {talent.name}
                        <span className="sheet-muted">{` (${talent.characteristic})`}</span>
                        {talent.penalty && <span className="sheet-muted">{` ${talent.penalty}`}</span>}
                      </span>
                      <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{talent.display}</span>
                    </li>
                  ))
                }
              </ul>
            </div>
          ))
        }
      </div>
    </SheetSection>
  );
};
