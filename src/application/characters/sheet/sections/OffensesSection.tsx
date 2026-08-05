import { SheetOffenseLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";

const headers = ["atak", "broń wiodąca", "kryt", "broń druga", "kryt", "obrażenia", "dodatkowe"] as const;

export default function OffensesSection({ offenses }: { offenses: SheetOffenseLine[] })
{
  if (offenses.length === 0) return null;

  return (
    <SheetSection title="ataki" note="kryt: zakres / siła">
      <SheetTable headers={headers}>
        {
          offenses.map(offense => (
            <tr key={offense.id} className={offense.isDefault ? "is-default" : undefined}>
              <td className="is-name">{offense.name}</td>
              <td className="is-numeric"><b>{offense.leading}</b></td>
              <td className="is-numeric">{offense.leadingCritical}</td>
              <td className="is-numeric">{offense.secondary ?? ""}</td>
              <td className="is-numeric">{offense.secondaryCritical ?? ""}</td>
              <td className="is-numeric"><b>{offense.damage}</b></td>
              <td className="is-numeric">{offense.additionalDamage ?? ""}</td>
            </tr>
          ))
        }
      </SheetTable>
    </SheetSection>
  );
};
