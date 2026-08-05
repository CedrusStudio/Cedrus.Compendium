import { PropsWithChildren } from "react";

type SheetSectionProps =
{
  title: string;
  /** Starts the section on a fresh sheet of paper (moce, umiejętności, załącznik). */
  pageBreak?: boolean;
  /** Right-hand note in the heading line — units, legends, counts. */
  note?: string;
};

/**
 * One titled block of the printed sheet. Renders nothing at all when there is
 * no content, so an empty category never costs a heading row on paper.
 */
export default function SheetSection({ title, pageBreak, note, children }: PropsWithChildren<SheetSectionProps>)
{
  if (!children) return null;

  return (
    <section className={pageBreak ? "sheet-section sheet-page-break" : "sheet-section"}>
      <h2 className="sheet-heading">
        {title}
        {note && <span className="sheet-muted" style={{ float: "right", fontWeight: 400, letterSpacing: 0 }}>{note}</span>}
      </h2>
      {children}
    </section>
  );
};
