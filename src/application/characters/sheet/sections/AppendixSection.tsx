import { SheetAppendixGroup } from "@/domain/characters/sheet/sheetModel";
import SheetSection from "@/application/characters/sheet/primitives/SheetSection";

/**
 * Full authored descriptions, opt-in. Everything above the appendix is cut to a
 * single line per entry; this is where the text those lines came from lives.
 */
export default function AppendixSection({ groups }: { groups: SheetAppendixGroup[] })
{
  if (groups.length === 0) return null;

  return (
    <SheetSection title="załącznik — pełne opisy" pageBreak>
      {
        groups.map(group => (
          <div key={group.title} style={{ marginBottom: "2.5mm" }}>
            <h3 className="sheet-subheading">{group.title}</h3>
            <div className="sheet-columns-2">
              {
                group.entries.map(entry => (
                  <div key={entry.id} className="sheet-appendix-entry">
                    <span className="name">{entry.name}</span>
                    <span className="sheet-muted">{` (${entry.grade})`}</span>
                    {entry.description && <div className="body">{entry.description}</div>}
                  </div>
                ))
              }
            </div>
          </div>
        ))
      }
    </SheetSection>
  );
};
