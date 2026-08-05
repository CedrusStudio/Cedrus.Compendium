import { SheetStatLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";

type StatsSectionProps =
{
  characteristics: SheetStatLine[];
  attributes: SheetStatLine[];
};

/**
 * Each component of a statistic gets its own column. The sheet is a record of
 * the character, so the reader has to be able to tell a base value from a
 * permanent bonus from a test bonus — a single collapsed `1k8+11` hides that.
 *
 * Full names rather than the print abbreviations: at half page width there is
 * room for "czarokrwistość", and it saves a legend line under each block.
 */
export default function StatsSection({ characteristics, attributes }: StatsSectionProps)
{
  return (
    <div className="sheet-row">

      <div className="sheet-grow">
        <SheetSection title="cechy">
          <StatTable nameHeader="cecha" statistics={characteristics} />
        </SheetSection>
      </div>

      <div className="sheet-grow">
        <SheetSection title="atrybuty">
          <StatTable nameHeader="atrybut" statistics={attributes} />
        </SheetSection>
      </div>

    </div>
  );
};

function StatTable({ nameHeader, statistics }: { nameHeader: string; statistics: SheetStatLine[] })
{
  return (
    <SheetTable headers={[nameHeader, "kość", "wart.", "bonus", "test", "razem"]}>
      {
        statistics.map(statistic => (
          <tr key={statistic.key}>
            <td className="is-name">{statistic.label}</td>
            <td className="is-numeric">{statistic.dice}</td>
            <td className="is-numeric">{statistic.value}</td>
            <Modifier value={statistic.bonus} />
            <Modifier value={statistic.testBonus} />
            <td className="is-numeric"><b>{statistic.total}</b></td>
          </tr>
        ))
      }
    </SheetTable>
  );
};

/** Zeroes print blank — a column of `+0` is noise, an empty cell reads faster. */
function Modifier({ value }: { value: number })
{
  return <td className="is-numeric">{value === 0 ? "" : `${value > 0 ? "+" : ""}${value}`}</td>;
};
