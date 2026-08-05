import { SheetVitals } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";

/**
 * Reference values only. There is deliberately no damage tally or any other
 * fill-in widget here: the sheet records what the character *is*, and tracking
 * what happens to them during a fight belongs in the app, not on paper.
 */
export default function VitalsSection({ vitals }: { vitals: SheetVitals })
{
  return (
    <SheetSection title="zdrowie">
      <div className="sheet-vitals">

        <div className="sheet-vitals-total">
          <span className="value">{vitals.totalHealth}</span>
          <span className="caption">zdrowie</span>
        </div>

        <div className="sheet-vitals-pairs">
          <span className="sheet-vitals-pair">
            <span className="sheet-muted">poziom leczenia </span>
            <b>{vitals.recoveryLevel}</b>
          </span>
          {
            vitals.rows.map(row => (
              <span key={row.label} className="sheet-vitals-pair">
                <span className="sheet-muted">{row.label} </span>
                <b>{row.value}</b>
              </span>
            ))
          }
        </div>

      </div>
    </SheetSection>
  );
};
