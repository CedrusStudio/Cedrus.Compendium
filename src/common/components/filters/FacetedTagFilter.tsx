"use client";

import { useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/common/components/ui/collapsible";
import { ChevronDown, ChevronsUpDown, X } from "lucide-react";
import type { ResolvedTagFacet, TagFacetFilter, TagFacetIndex } from "@/domain/tags/tagFacets";

type FacetedTagFilterProps =
{
  index: TagFacetIndex;
  filters: TagFacetFilter[];
  onFiltersChange: (filters: TagFacetFilter[]) => void;
  isLoading?: boolean;
};

const NONE_LABEL = "— brak —";

/**
 * Category filter (Wave 10.4).
 *
 * Sections come from `TagFacet.order`; the "Pozostałe" bucket at the end holds
 * every tag no definition claims and is always rendered, so a newly added tag
 * can never quietly vanish from the filter.
 *
 * Two behaviours worth stating, because both are deliberate:
 *
 *  - Selecting several values inside one category is a UNION. Picking
 *    `zwierzęta` and `potwory` shows 147 maneuvers, not the 117 they share and
 *    not the zero that today's `$all` returns.
 *  - "Wyłącznie ta kategoria" is an explicit button, never automatic. 215 of the
 *    379 creature maneuvers carry more than one kind, so auto-excluding the rest
 *    of a category would silently drop 117 records that genuinely are animals.
 */
export default function FacetedTagFilter({ index, filters, onFiltersChange, isLoading = false }: FacetedTagFilterProps)
{
  const filterFor = (facetKey: string): TagFacetFilter =>
    filters.find(filter => filter.facetKey === facetKey) ?? { facetKey, tags: [], includeNone: false };

  const replaceFilter = (next: TagFacetFilter) =>
  {
    const others = filters.filter(filter => filter.facetKey !== next.facetKey);
    const isEmpty = next.tags.length === 0 && !next.includeNone;
    onFiltersChange(isEmpty ? others : [...others, next]);
  };

  const toggleValue = (facet: ResolvedTagFacet, tag: string) =>
  {
    const current = filterFor(facet.key);
    const selected = current.tags.includes(tag);

    // `single` categories (only armour weight) replace rather than accumulate.
    const tags = selected
      ? current.tags.filter(existing => existing !== tag)
      : facet.selectionMode === "single" ? [tag] : [...current.tags, tag];

    replaceFilter({ ...current, tags });
  };

  const toggleNone = (facet: ResolvedTagFacet) =>
  {
    const current = filterFor(facet.key);
    replaceFilter({ ...current, includeNone: !current.includeNone });
  };

  const onlyThis = (facet: ResolvedTagFacet, tag: string) =>
    replaceFilter({ facetKey: facet.key, tags: [tag], includeNone: false });

  const clearFacet = (facetKey: string) =>
    onFiltersChange(filters.filter(filter => filter.facetKey !== facetKey));

  const activeCount = filters.reduce((total, filter) => total + filter.tags.length + (filter.includeNone ? 1 : 0), 0);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 shrink-0 justify-between" disabled={isLoading}>
            {isLoading ? "Ładowanie..." : "Filtruj"}
            {
              activeCount > 0 && (
                <span className="ml-2 rounded bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>
              )
            }
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent align="start" className="max-h-[70vh] w-[340px] overflow-y-auto p-0">
          <div className="sticky top-0 z-10 border-b bg-popover px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium">
                Kategorie{activeCount > 0 ? ` · wybrano ${activeCount}` : ""}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                disabled={activeCount === 0}
                onClick={() => onFiltersChange([])}
              >
                Wyczyść
              </Button>
            </div>

            {/* Dwie zasady, których nie da się odgadnąć z samych przycisków, a
                obie zmieniają wynik. Jedna linijka — dłuższy wykład jest
                w panelu admina. */}
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              W jednej kategorii wybory się <strong>sumują</strong>, między kategoriami <strong>zawężają</strong>.
              „{NONE_LABEL}” znaczy „nie ma żadnego tagu z tej kategorii”. Tagi bez kategorii są na końcu,
              w sekcji „Pozostałe”.
            </p>
          </div>

          {
            index.facets.map(facet =>
            {
              const current = filterFor(facet.key);
              const chosen = current.tags.length + (current.includeNone ? 1 : 0);

              return (
                <FacetSection
                  key={facet.key}
                  facet={facet}
                  chosen={chosen}
                  selectedTags={current.tags}
                  noneSelected={current.includeNone === true}
                  onToggleValue={tag => toggleValue(facet, tag)}
                  onToggleNone={() => toggleNone(facet)}
                  onOnlyThis={tag => onlyThis(facet, tag)}
                  onClear={() => clearFacet(facet.key)}
                />
              );
            })
          }

          {
            index.facets.length === 0 && (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                Brak zdefiniowanych kategorii dla tej listy. Użyj trybu „Tagi”.
              </p>
            )
          }
        </PopoverContent>
      </Popover>

      {
        activeCount > 0 && (
          // `basis-full` breaks the chips onto their own line inside the parent
          // row, so a long selection wraps instead of squeezing the controls.
          <div className="flex basis-full flex-row flex-wrap gap-1.5">
            {
              filters.flatMap(filter =>
              {
                const facet = index.facets.find(candidate => candidate.key === filter.facetKey);
                if (!facet) return [];

                const chips = filter.tags.map(tag => (
                  <Button
                    key={`${filter.facetKey}-${tag}`}
                    type="button"
                    size="sm"
                    variant="default"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => toggleValue(facet, tag)}
                  >
                    {/* The category name travels with the chip so the result set
                        is readable from the bar alone — otherwise "nieumarli"
                        and "widmowy" look like the same kind of choice. */}
                    <span className="opacity-70">{facet.label}:</span>
                    <span>{facet.values.find(value => value.tag === tag)?.label ?? tag}</span>
                    <X className="h-3 w-3" />
                  </Button>
                ));

                if (filter.includeNone)
                {
                  chips.push(
                    <Button
                      key={`${filter.facetKey}-none`}
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => toggleNone(facet)}
                    >
                      <span className="opacity-70">{facet.label}:</span>
                      <span>{NONE_LABEL}</span>
                      <X className="h-3 w-3" />
                    </Button>,
                  );
                }

                return chips;
              })
            }
          </div>
        )
      }
    </>
  );
}

type FacetSectionProps =
{
  facet: ResolvedTagFacet;
  chosen: number;
  selectedTags: string[];
  noneSelected: boolean;
  onToggleValue: (tag: string) => void;
  onToggleNone: () => void;
  onOnlyThis: (tag: string) => void;
  onClear: () => void;
};

function FacetSection({ facet, chosen, selectedTags, noneSelected, onToggleValue, onToggleNone, onOnlyThis, onClear }: FacetSectionProps)
{
  const [open, setOpen] = useState(chosen > 0);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b last:border-b-0">
      <div className="flex items-center justify-between gap-1 px-2 py-1">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 flex-1 justify-start gap-1.5 px-1 text-xs">
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
            <span className="font-medium">{facet.label}</span>
            {chosen > 0 && <span className="rounded bg-primary px-1.5 text-[10px] text-primary-foreground">{chosen}</span>}
          </Button>
        </CollapsibleTrigger>

        {chosen > 0 && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={onClear} type="button">
            Wyczyść
          </Button>
        )}
      </div>

      <CollapsibleContent className="px-2 pb-2">
        {facet.description && <p className="mb-1.5 px-1 text-xs leading-snug text-muted-foreground">{facet.description}</p>}

        <div className="flex flex-wrap gap-1">
          {
            facet.supportsNone && (
              <Button
                type="button"
                size="sm"
                variant={noneSelected ? "secondary" : "outline"}
                className="h-7 border-dashed px-2 text-xs"
                onClick={onToggleNone}
                title="Wpisy, które nie mają żadnego tagu z tej kategorii"
              >
                {NONE_LABEL}
              </Button>
            )
          }

          {
            facet.values.map(value => (
              <span key={value.tag} className="group relative inline-flex">
                <Button
                  type="button"
                  size="sm"
                  variant={selectedTags.includes(value.tag) ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => onToggleValue(value.tag)}
                  // Aliases are invisible in the label but decide what matches,
                  // so they belong in the tooltip rather than nowhere.
                  title={value.spellings.length > 1 ? `dopasowuje: ${value.spellings.join(", ")}` : undefined}
                >
                  {value.label}
                </Button>

                {
                  facet.selectionMode === "single" && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="hidden h-7 px-1 text-[10px] text-muted-foreground group-hover:inline-flex"
                      onClick={() => onOnlyThis(value.tag)}
                      title="Wyłącznie ta kategoria"
                    >
                      tylko
                    </Button>
                  )
                }
              </span>
            ))
          }
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
