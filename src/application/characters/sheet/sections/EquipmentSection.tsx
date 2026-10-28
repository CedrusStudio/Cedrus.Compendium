import { SheetEquipment, SheetItemLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";
import { needsOwnPage } from "@/application/characters/sheet/primitives/needsOwnPage";
import { SheetStatLabel } from "@/application/characters/sheet/primitives/SheetStatIcon";

const restrictionHeaders = [
  <EquipmentStatHeader key="strength" statKey="strength" prefix="wym." label="SIŁ" />,
  <EquipmentStatHeader key="dexterity" statKey="dexterity" prefix="ogr." label="ZRC" />,
  <EquipmentStatHeader key="reflex" statKey="reflex" prefix="ogr." label="REF" />,
  <EquipmentStatHeader key="initiative" statKey="initiative" prefix="ogr." label="INI" />,
];

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
            <SheetTable headers={["pancerz", "red.", <SheetStatLabel key="immunity" statKey="immunity" label="niewr." />, <SheetStatLabel key="resistance" statKey="resistance" label="odp." />, ...restrictionHeaders, "kara", "opis"]}>
              {
                equipment.armors.map(armor => (
                  <tr key={armor.id}>
                    <td className="is-name">{armor.name}</td>
                    <td className="is-numeric"><b>{armor.protection}</b></td>
                    <Numeric value={armor.immunity} statistic />
                    <Numeric value={armor.resistance} statistic />
                    <Numeric value={armor.strengthRequirement} statistic />
                    <Numeric value={armor.dexterityRestriction} statistic />
                    <Numeric value={armor.reflexRestriction} statistic />
                    <Numeric value={armor.initiativeRestriction} statistic />
                    <Numeric value={armor.attributePenalty} />
                    <td className="is-summary">{armor.summary}</td>
                  </tr>
                ))
              }
            </SheetTable>
            <EquipmentLegend armor />
          </Category>
        )
      }

      {
        equipment.shields.length > 0 && (
          <Category label="tarcze">
            <SheetTable headers={["tarcza", "blok", <SheetStatLabel key="resistance" statKey="resistance" label="odp." />, ...restrictionHeaders, "kara", "opis"]}>
              {
                equipment.shields.map(shield => (
                  <tr key={shield.id}>
                    <td className="is-name">{shield.name}</td>
                    <td className="is-numeric"><b>{shield.block}</b></td>
                    <Numeric value={shield.resistance} statistic />
                    <Numeric value={shield.strengthRequirement} statistic />
                    <Numeric value={shield.dexterityRestriction} statistic />
                    <Numeric value={shield.reflexRestriction} statistic />
                    <Numeric value={shield.initiativeRestriction} statistic />
                    <Numeric value={shield.attributePenalty} />
                    <td className="is-summary">{shield.summary}</td>
                  </tr>
                ))
              }
            </SheetTable>
            <EquipmentLegend />
          </Category>
        )
      }

      {
        equipment.mounts.length > 0 && (
          <Category label="wierzchowce">
            <SheetTable headers={["wierzchowiec", "stęp", "kłus", "galop", <EquipmentStatHeader key="horsemanship" statKey="horsemanship" prefix="premia" label="JEŹ" />, "opis"]}>
              {
                equipment.mounts.map(mount => (
                  <tr key={mount.id}>
                    <td className="is-name">{mount.name}</td>
                    <Numeric value={mount.paceSpeed} />
                    <Numeric value={mount.canterSpeed} />
                    <Numeric value={mount.gallopSpeed} />
                    <Numeric value={mount.horsemanshipBonus} statistic />
                    <td className="is-summary">{mount.summary}</td>
                  </tr>
                ))
              }
            </SheetTable>
            <p className="sheet-legend sheet-symbol-legend">JEŹ = jeździectwo</p>
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

function EquipmentStatHeader({ statKey, prefix, label }: { statKey: string; prefix: string; label: string })
{
  return <span className="sheet-equipment-stat-header"><span>{prefix}</span><SheetStatLabel statKey={statKey} label={label} /></span>;
}

function EquipmentLegend({ armor = false }: { armor?: boolean })
{
  return (
    <p className="sheet-legend">
      wym. = wymaganie · ogr. = ograniczenie
      <span className="sheet-symbol-legend"> · SIŁ = siła · ZRC = zręczność · REF = refleks · INI = inicjatywa</span>
      {armor && " · red. = redukcja"}
      <span className="sheet-symbol-legend">{armor && " · niewr. = niewrażliwość"} · odp. = odporność</span>
    </p>
  );
}

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

function Numeric({ value, statistic = false }: { value: number; statistic?: boolean })
{
  return <td className={statistic ? "is-numeric is-statistic" : "is-numeric"}>{value === 0 ? "" : value}</td>;
};
