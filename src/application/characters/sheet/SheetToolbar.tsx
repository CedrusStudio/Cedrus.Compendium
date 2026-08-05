"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/ui/button";
import { Checkbox } from "@/ui/checkbox";
import { Label } from "@/ui/label";
import { Separator } from "@/ui/separator";
import {
  SheetOptions,
  SheetSection,
  sheetSectionLabels,
  sheetSections,
  toSheetQuery,
} from "@/domain/characters/sheet/sheetOptions";

type SheetToolbarProps =
{
  characterId: string;
  options: SheetOptions;
};

/**
 * Screen-only controls above the sheet. Carries `screen-only`, so it disappears
 * from the printed page.
 *
 * Toggling a section rewrites the query string rather than holding state — the
 * sheet is server-rendered from those params, and the resulting URL can be
 * bookmarked or shared as-is.
 */
export default function SheetToolbar({ characterId, options }: SheetToolbarProps)
{
  const router = useRouter();

  const applyOptions = (nextOptions: SheetOptions) =>
  {
    router.replace(`/characters/${characterId}/sheet${toSheetQuery(nextOptions)}`, { scroll: false });
  };

  const toggleSection = (section: SheetSection, enabled: boolean) =>
  {
    const nextSections = enabled
      ? [...options.sections, section]
      : options.sections.filter(current => current !== section);

    applyOptions({ ...options, sections: nextSections });
  };

  return (
    <div className="screen-only sheet-toolbar flex flex-col gap-3 rounded-lg border p-4">

      <div className="flex flex-wrap items-center justify-between gap-3">

        <Button asChild variant="ghost" size="sm">
          <Link href={`/characters/${characterId}`}>
            <ArrowLeft className="h-4 w-4" />
            <span>Wróć do postaci</span>
          </Link>
        </Button>

        <Button onClick={() => window.print()} size="sm">
          <Printer className="h-4 w-4" />
          <span>Drukuj / zapisz PDF</span>
        </Button>

      </div>

      <Separator />

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {
          sheetSections.map(section => (
            <div key={section} className="flex items-center gap-2">
              <Checkbox
                id={`sheet-section-${section}`}
                checked={options.sections.includes(section)}
                onCheckedChange={checked => toggleSection(section, checked === true)}
              />
              <Label htmlFor={`sheet-section-${section}`} className="text-sm font-normal first-letter:uppercase">
                {sheetSectionLabels[section]}
              </Label>
            </div>
          ))
        }

        <div className="flex items-center gap-2">
          <Checkbox
            id="sheet-appendix"
            checked={options.appendix}
            onCheckedChange={checked => applyOptions({ ...options, appendix: checked === true })}
          />
          <Label htmlFor="sheet-appendix" className="text-sm font-medium">
            Załącznik z pełnymi opisami
          </Label>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        W oknie drukowania odznacz „Nagłówki i stopki”. Karta jest zaprojektowana pod czarno-biały wydruk A4 —
        „Grafika tła” nie jest potrzebna.
      </p>

    </div>
  );
};
