import { SheetDefenseLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";

const headers = ["obrona", "niewr.", "odp.", "pancerz", "blok", "par.", "unik", "bonus", "pełna", "blok", "bezp."] as const;

export default function DefensesSection({ defenses }: { defenses: SheetDefenseLine[] })
{
  if (defenses.length === 0) return null;

  return (
    <SheetSection title="obrony" note="redukcja: pełna / z blokiem / bezpośrednia">
      <SheetTable headers={headers}>
        {
          defenses.map(defense => (
            <tr key={defense.id} className={defense.isDefault ? "is-default" : undefined}>
              <td className="is-name">{defense.name}</td>
              <Numeric value={defense.immunity} />
              <Numeric value={defense.resistance} />
              <Numeric value={defense.protection} />
              <Numeric value={defense.block} />
              <Numeric value={defense.parry} />
              <Numeric value={defense.dodge} />
              <Numeric value={defense.bonus} />
              <td className="is-numeric"><b>{defense.fullReduction}</b></td>
              <td className="is-numeric"><b>{defense.blockReduction}</b></td>
              <td className="is-numeric"><b>{defense.directReduction}</b></td>
            </tr>
          ))
        }
      </SheetTable>
    </SheetSection>
  );
};

/** Zeroes print as blanks — an empty cell reads faster than a column of `0`. */
function Numeric({ value }: { value: number })
{
  return <td className="is-numeric">{value === 0 ? "" : value}</td>;
};
