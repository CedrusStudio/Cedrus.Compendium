import { SheetEquipment, SheetItemLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";
import { needsOwnPage } from "@/application/characters/sheet/primitives/needsOwnPage";

/**
 * Every category gets the columns it actually has.
 *
 * The first version joined all values into one string per item; on paper that
 * forced the name column wide, stopped numbers lining up between rows and left
 * the description whatever space remained. Real columns fix all three: names
 * wrap, numbers align, and the description takes the rest of the row.
 */
export default function EquipmentSection({ equipment }: { equipment: SheetEquipment })
{
  const itemCount = Object.values(equipment).reduce((count, items) => count + items.length, 0);

  if (itemCount === 0) return null;

  return (
    <SheetSection
      title="ekwipunek"
      pageBreak={needsOwnPage(itemCount)}
      note="wym. = wymaganie · ogr. = ograniczenie · SIŁ siła · ZRC zręczność · REF refleks · INI inicjatywa"
    >

      {
        equipment.weapons.length > 0 && (
          <Category label="bronie">
            <SheetTable headers={["broń", "styl", "zasięg", "atak", "kryt", "obrażenia", "opis"]}>
              {
                equipment.weapons.map(weapon => (
                  <tr key={weapon.id}>
                    <td className="is-name">{weapon.name}</td>
                    <td>{weapon.style}</td>
                    <Numeric value={weapon.range} />
                    <td className="is-numeric"><b>{weapon.attack}</b></td>
                    <td className="is-numeric">{weapon.critical}</td>
                    <td className="is-numeric">{weapon.damage}</td>
                    <td className="is-summary">{weapon.summary}</td>
                  </tr>
                ))
              }
            </SheetTable>
          </Category>
        )
      }

      {
        equipment.armors.length > 0 && (
          <Category label="pancerze">
            <SheetTable headers={["pancerz", "red.", "niewr.", "odp.", "wym. SIŁ", "ogr. ZRC", "ogr. REF", "ogr. INI", "kara", "opis"]}>
              {
                equipment.armors.map(armor => (
                  <tr key={armor.id}>
                    <td className="is-name">{armor.name}</td>
                    <td className="is-numeric"><b>{armor.protection}</b></td>
                    <Numeric value={armor.immunity} />
                    <Numeric value={armor.resistance} />
                    <Numeric value={armor.strengthRequirement} />
                    <Numeric value={armor.dexterityRestriction} />
                    <Numeric value={armor.reflexRestriction} />
                    <Numeric value={armor.initiativeRestriction} />
                    <Numeric value={armor.attributePenalty} />
                    <td className="is-summary">{armor.summary}</td>
                  </tr>
                ))
              }
            </SheetTable>
          </Category>
        )
      }

      {
        equipment.shields.length > 0 && (
          <Category label="tarcze">
            <SheetTable headers={["tarcza", "blok", "odp.", "wym. SIŁ", "ogr. ZRC", "ogr. REF", "ogr. INI", "kara", "opis"]}>
              {
                equipment.shields.map(shield => (
                  <tr key={shield.id}>
                    <td className="is-name">{shield.name}</td>
                    <td className="is-numeric"><b>{shield.block}</b></td>
                    <Numeric value={shield.resistance} />
                    <Numeric value={shield.strengthRequirement} />
                    <Numeric value={shield.dexterityRestriction} />
                    <Numeric value={shield.reflexRestriction} />
                    <Numeric value={shield.initiativeRestriction} />
                    <Numeric value={shield.attributePenalty} />
                    <td className="is-summary">{shield.summary}</td>
                  </tr>
                ))
              }
            </SheetTable>
          </Category>
        )
      }

      {
        equipment.mounts.length > 0 && (
          <Category label="wierzchowce">
            <SheetTable headers={["wierzchowiec", "stęp", "kłus", "galop", "jeźdz.", "opis"]}>
              {
                equipment.mounts.map(mount => (
                  <tr key={mount.id}>
                    <td className="is-name">{mount.name}</td>
                    <Numeric value={mount.paceSpeed} />
                    <Numeric value={mount.canterSpeed} />
                    <Numeric value={mount.gallopSpeed} />
                    <Numeric value={mount.horsemanshipBonus} />
                    <td className="is-summary">{mount.summary}</td>
                  </tr>
                ))
              }
            </SheetTable>
          </Category>
        )
      }

      {
        equipment.inventory.length > 0 && (
          <Category label="przedmioty">
            <ItemColumns items={equipment.inventory} />
          </Category>
        )
      }

    </SheetSection>
  );
};

function Category({ label, children }: { label: string; children: React.ReactNode })
{
  return (
    <div>
      <h3 className="sheet-subheading">{label}</h3>
      {children}
    </div>
  );
};

/** Plain inventory carries no numbers, so a full-width table row would be waste. */
function ItemColumns({ items }: { items: SheetItemLine[] })
{
  return (
    <div className="sheet-columns-2">
      {
        items.map(item => (
          <div key={item.id} className="sheet-compact-entry">
            <b>{item.name}</b>
            {item.summary && ` — ${item.summary}`}
          </div>
        ))
      }
    </div>
  );
};

function Numeric({ value }: { value: number })
{
  return <td className="is-numeric">{value === 0 ? "" : value}</td>;
};
