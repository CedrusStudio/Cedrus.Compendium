import { SheetHeader } from "@/domain/characters/sheet/sheetModel";

export default function HeaderSection({ header }: { header: SheetHeader })
{
  const meta = [header.race, header.tags.join(", ")].filter(Boolean).join(" · ");

  return (
    <header className="sheet-title">
      <h1>{header.name}</h1>
      <div className="sheet-title-meta">
        <div><strong>{header.shortName}</strong></div>
        {meta && <div className="sheet-muted">{meta}</div>}
        <div className="sheet-muted">{header.generatedOn}</div>
      </div>
    </header>
  );
};
