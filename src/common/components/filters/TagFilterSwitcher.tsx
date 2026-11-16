"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/common/components/ui/button";
import TagFilter from "@/common/components/filters/TagFilter";
import FacetedTagFilter from "@/common/components/filters/FacetedTagFilter";
import { useTagFacets } from "@/common/hooks/useTagFacets";
import type { EntityType } from "@/infrastructure/clients/tagsClient";
import type { TagFacetFilter } from "@/domain/tags/tagFacets";

const STORAGE_KEY = "tag-filter-mode";
const MODE_EVENT = "tag-filter-mode-change";
function subscribeToMode(onChange: () => void)
{
  window.addEventListener('storage', onChange);
  window.addEventListener(MODE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(MODE_EVENT, onChange);
  };
}
const readMode = () => window.localStorage.getItem(STORAGE_KEY) !== 'flat';
const serverMode = () => false;

type TagFilterSwitcherProps =
{
  entity: EntityType;
  includedTags: string[];
  onIncludedTagsChange: (tags: string[]) => void;
  excludedTags: string[];
  onExcludedTagsChange: (tags: string[]) => void;
  availableTags: string[];
  isLoading?: boolean;
  facetFilters: TagFacetFilter[];
  onFacetFiltersChange: (filters: TagFacetFilter[]) => void;
};

/**
 * Chooses between the category filter and the flat tag list (Wave 10.4).
 *
 * The flat filter is NOT a fallback that only appears when something breaks —
 * it is a mode the user can pick, because the two answer different questions.
 * In category mode "rodzaj istoty: zwierzęta" also matches `natura` on a
 * Character; in flat mode typing `natura` matches exactly `natura`. Both are
 * correct, so both stay reachable — and the raw tag is the only way to see what
 * is really stored, which matters when tagging.
 *
 * With no categories defined (or the endpoint down) the switch hides itself and
 * the flat filter renders alone. The tag filter must never stop working because
 * the descriptive layer is unavailable.
 */
export default function TagFilterSwitcher(props: TagFilterSwitcherProps)
{
  const { index, isLoading: facetsLoading, hasFacets } = useTagFacets(props.entity);
  const byCategory = useSyncExternalStore(subscribeToMode, readMode, serverMode);

  const switchTo = (next: boolean) =>
  {
    window.localStorage.setItem(STORAGE_KEY, next ? "categories" : "flat");
    window.dispatchEvent(new Event(MODE_EVENT));
  };

  const showCategories = byCategory && hasFacets;

  return (
    // Sized to its content, NOT `w-full`: inside the header's wrapping flex row
    // a full-width filter eats the whole line and pushes the requirement filter
    // onto the next one, which is exactly what it looked like before.
    <div className="flex w-auto max-w-[34rem] flex-col gap-2">
      {/* One row for the controls so the filter lines up with the search and
          grade inputs; the chosen values wrap onto their own row below. */}
      <div className="flex flex-wrap items-center gap-2">
        {
          hasFacets && (
            <div className="inline-flex min-h-9 shrink-0 items-center rounded-md border p-0.5" role="group" aria-label="Tryb filtrowania">
              <Button
                type="button"
                size="sm"
                variant={showCategories ? "default" : "ghost"}
                className="h-8 rounded-sm px-2.5 text-xs"
                aria-pressed={showCategories}
                onClick={() => switchTo(true)}
              >
                Kategorie
              </Button>
              <Button
                type="button"
                size="sm"
                variant={showCategories ? "ghost" : "default"}
                className="h-8 rounded-sm px-2.5 text-xs"
                aria-pressed={!showCategories}
                onClick={() => switchTo(false)}
              >
                Tagi
              </Button>
            </div>
          )
        }

        {
          showCategories
            ? (
              <FacetedTagFilter
                index={index}
                filters={props.facetFilters}
                onFiltersChange={props.onFacetFiltersChange}
                isLoading={facetsLoading}
              />
            )
            : (
              // `TagFilter` is `w-full` and shared with three other screens, so
              // it gets a sized box here instead of having its own width changed.
              <div className="w-[min(26rem,100%)]">
                <TagFilter
                  includedTags={props.includedTags}
                  onIncludedTagsChange={props.onIncludedTagsChange}
                  excludedTags={props.excludedTags}
                  onExcludedTagsChange={props.onExcludedTagsChange}
                  availableTags={props.availableTags}
                  isLoading={props.isLoading}
                />
              </div>
            )
        }
      </div>
    </div>
  );
}
