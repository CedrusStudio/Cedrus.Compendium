import { SheetActionLine } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";
import SheetTable from "@/application/characters/sheet/primitives/SheetTable";

type ActionsSectionProps =
{
  maneuvers: SheetActionLine[];
  stances: SheetActionLine[];
  states: SheetActionLine[];
};

export default function ActionsSection({ maneuvers, stances, states }: ActionsSectionProps)
{
  if (maneuvers.length === 0 && stances.length === 0 && states.length === 0) return null;

  return (
    <>
      {
        maneuvers.length > 0 && (
          <SheetSection title="manewry" note={`${maneuvers.length}`}>
            <SheetTable headers={["manewr", "ranga", "czas", "odnow.", "efekt"]}>
              {
                maneuvers.map(maneuver => (
                  <tr key={maneuver.id}>
                    <td className="is-name">{maneuver.name}</td>
                    <td className="is-numeric">{maneuver.grade}</td>
                    <td>{shortCastTime(maneuver.castTime)}</td>
                    <td className="is-numeric">{maneuver.cooldown ?? ""}</td>
                    <td className="is-summary">{maneuver.summary}</td>
                  </tr>
                ))
              }
            </SheetTable>
          </SheetSection>
        )
      }

      <div className="sheet-row">
        <ModeTable title="postawy" columnLabel="postawa" modes={stances} />
        <ModeTable title="stany" columnLabel="stan" modes={states} />
      </div>
    </>
  );
};

function ModeTable({ title, columnLabel, modes }: { title: string; columnLabel: string; modes: SheetActionLine[] })
{
  if (modes.length === 0) return null;

  return (
    <div className="sheet-grow">
      <SheetSection title={title}>
        <SheetTable headers={[columnLabel, "ranga", "efekt"]}>
          {
            modes.map(mode => (
              <tr key={mode.id}>
                <td className="is-name">{mode.name}</td>
                <td className="is-numeric">{mode.grade}</td>
                <td className="is-summary">{mode.summary}</td>
              </tr>
            ))
          }
        </SheetTable>
      </SheetSection>
    </div>
  );
};

/**
 * Cast times are long words in a narrow column; the sheet legend under the
 * maneuver table is not worth a row, so the abbreviations are self-evident
 * prefixes of the full names.
 */
export function shortCastTime(castTime: string | undefined): string
{
  if (!castTime) return "";

  const abbreviations: Record<string, string> =
  {
    'Nadnatychmiastowa': 'Nadnat.',
    'Natychmiastowa': 'Natych.',
    'Standardowa': 'Std',
    'Pełnorundowa': 'Pełna',
  };

  return abbreviations[castTime] ?? castTime;
};
