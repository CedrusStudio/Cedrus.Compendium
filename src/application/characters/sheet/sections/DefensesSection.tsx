import { SheetDefenseLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";
import { SheetStatLabel } from "@/application/characters/sheet/primitives/SheetStatIcon";

const headers = [
  "obrona",
  <SheetStatLabel key="immunity" statKey="immunity" label="niewr." />,
  <SheetStatLabel key="resistance" statKey="resistance" label="odp." />,
  "pancerz", "blokowanie", "parowanie", "unik", "bonus",
  <SheetStatLabel key="fullReduction" statKey="fullReduction" label="pełna" />,
  <SheetStatLabel key="blockReduction" statKey="blockReduction" label="z blokiem" />,
  <SheetStatLabel key="directReduction" statKey="directReduction" label="bezp." />,
] as const;
const groups = [
  { label: "", columns: 1 },
  { label: "składniki obrony", columns: 7 },
  { label: "redukcja", columns: 3 },
] as const;

export default function DefensesSection({ defenses }: { defenses: SheetDefenseLine[] })
{
  if (defenses.length === 0) return null;

  return (
    <SheetSection title="obrony">
      <SheetTable headers={headers} groups={groups} className="sheet-defenses-table" columnWidths={['30%', ...Array<string>(10).fill('7%')]}>
        {
          defenses.map(defense => (
            <tr key={defense.id} className={defense.isDefault ? "is-default" : undefined}>
              <td className="is-name">{defense.name}</td>
              <Numeric value={defense.immunity} statistic />
              <Numeric value={defense.resistance} statistic />
              <Numeric value={defense.protection} />
              <Numeric value={defense.block} />
              <Numeric value={defense.parry} />
              <Numeric value={defense.dodge} />
              <Numeric value={defense.bonus} />
              <td className="is-numeric is-statistic"><b>{defense.fullReduction}</b></td>
              <td className="is-numeric is-statistic"><b>{defense.blockReduction}</b></td>
              <td className="is-numeric is-statistic"><b>{defense.directReduction}</b></td>
            </tr>
          ))
        }
      </SheetTable>
      <p className="sheet-legend"><span className="sheet-symbol-legend">niewr. = niewrażliwość · odp. = odporność · bezp. = bezpośrednia · </span>▸ domyślna obrona</p>
    </SheetSection>
  );
};

/** Zeroes print as blanks — an empty cell reads faster than a column of `0`. */
function Numeric({ value, statistic = false }: { value: number; statistic?: boolean })
{
  return <td className={statistic ? "is-numeric is-statistic" : "is-numeric"}>{value === 0 ? "" : value}</td>;
};
