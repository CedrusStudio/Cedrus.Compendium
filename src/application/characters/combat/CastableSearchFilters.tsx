"use client";

import ExistingTagSelect from "@/common/components/filters/ExistingTagSelect";
import CastTimeFilter from "@/common/components/filters/CastTimeFilter";
import { Input } from "@/common/components/ui/input";
import { displayedText } from "@/common/translations";
import type { CastTime } from "@/domain/characters/Castable";
import { Button } from "@/ui/button";

type CastableSearchFiltersProps = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  selectedCastTimes: CastTime[];
  onSelectedCastTimesChange: (castTimes: CastTime[]) => void;
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  availableTags: string[];
};

export default function CastableSearchFilters({
  searchInput,
  onSearchInputChange,
  selectedCastTimes,
  onSelectedCastTimesChange,
  selectedTags,
  onSelectedTagsChange,
  availableTags,
}: CastableSearchFiltersProps)
{
  const addSelectedTag = (tag: string) =>
  {
    if (selectedTags.includes(tag))
    {
      return;
    }

    onSelectedTagsChange([...selectedTags, tag]);
  };

  const removeSelectedTag = (tagToRemove: string) =>
  {
    onSelectedTagsChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <Input
          name="search"
          type="text"
          placeholder={displayedText.searchByName}
          value={searchInput}
          onChange={event => onSearchInputChange(event.target.value)}
          className="w-full lg:max-w-sm"
        />

        <div className="flex flex-col gap-2 lg:items-end">
          <ExistingTagSelect
            availableTags={availableTags}
            selectedTags={selectedTags}
            onSelectTag={addSelectedTag}
            triggerClassName="w-full sm:w-64"
          />

          {
            selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 lg:justify-end">
                {
                  selectedTags.map(tag => (
                    <Button
                      key={tag}
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => removeSelectedTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      {tag}
                    </Button>
                  ))
                }
              </div>
            )
          }
        </div>
      </div>

      <CastTimeFilter
        selectedCastTimes={selectedCastTimes}
        onSelectedCastTimesChange={onSelectedCastTimesChange}
      />
    </div>
  );
}