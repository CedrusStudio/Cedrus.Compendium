"use client";

import { useId, useState } from 'react';
import { displayedText } from '@/common/translations';
import { Input } from "@/common/components/ui/input";
import TagFilter from "@/common/components/filters/TagFilter";
import TagFilterSwitcher from "@/common/components/filters/TagFilterSwitcher";
import type { EntityType } from '@/infrastructure/clients/tagsClient';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import { QuickTagsPanel, QuickTagsToggle } from '@/application/personalization/QuickTagsSection';
import { MAX_GRADE_FILTER, MIN_GRADE_FILTER } from '@/common/global/gradeFilter';
import { type PersonalizationContext } from '@/common/personalization/personalizationProfile';

type ListHeaderProps = 
{
  searchInput: string;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  gradeFilter?: string;
  handleGradeFilterChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchTags: string[];
  handleSearchTagsChange: (tags: string[]) => void;
  excludedTags: string[];
  handleExcludedTagsChange: (tags: string[]) => void;
  availableTags: string[];
  tagsLoading: boolean;
  personalizationContext?: PersonalizationContext;
  /** Optional extra filter controls rendered inline in the main filter row. */
  extraFilters?: React.ReactNode;
  /**
   * Wave 10.4: pass these three together to offer the faceted filter. Omitting
   * them keeps the flat `TagFilter` exactly as it was, so a list that has not
   * been migrated yet is unaffected.
   */
  facetEntity?: EntityType;
  facetFilters?: TagFacetFilter[];
  handleFacetFiltersChange?: (filters: TagFacetFilter[]) => void;
}

export default function ListHeader
(
  { 
    children, 
    searchInput, 
    handleSearchInputChange, 
    gradeFilter,
    handleGradeFilterChange,
    searchTags, 
    handleSearchTagsChange,
    excludedTags,
    handleExcludedTagsChange,
    availableTags,
    tagsLoading,
    personalizationContext,
    extraFilters,
    facetEntity,
    facetFilters,
    handleFacetFiltersChange,
  }
  : React.PropsWithChildren<ListHeaderProps>)
{
  const [tagsOpen, setTagsOpen] = useState(true);
  const tagsId = useId();

  return (
    <div data-slot="list-header" className='z-10 m-3 flex min-w-0 flex-col gap-2 bg-background md:ml-12 lg:sticky lg:top-0 lg:flex-row lg:items-start lg:justify-between'>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2 lg:gap-4">
        <div className="flex flex-wrap items-start gap-2 lg:gap-4">
          <Input 
            name="search" 
            type="text" 
            placeholder={displayedText.searchByName}
            value={searchInput}
            onChange={handleSearchInputChange}
            className="w-full sm:max-w-xs md:max-w-sm"
          />

          {
            handleGradeFilterChange && (
              <Input
                name="grade"
                type="number"
                min={MIN_GRADE_FILTER}
                max={MAX_GRADE_FILTER}
                step={1}
                inputMode="numeric"
                aria-label={displayedText.grade}
                placeholder={`${displayedText.grade} ${MIN_GRADE_FILTER}-${MAX_GRADE_FILTER}`}
                value={gradeFilter ?? ""}
                onChange={handleGradeFilterChange}
                className="w-28 shrink-0"
              />
            )
          }

          {
            facetEntity && facetFilters && handleFacetFiltersChange
              ? (
                <TagFilterSwitcher
                  entity={facetEntity}
                  includedTags={searchTags}
                  onIncludedTagsChange={handleSearchTagsChange}
                  excludedTags={excludedTags}
                  onExcludedTagsChange={handleExcludedTagsChange}
                  availableTags={availableTags}
                  isLoading={tagsLoading}
                  facetFilters={facetFilters}
                  onFacetFiltersChange={handleFacetFiltersChange}
                />
              )
              : (
                <TagFilter
                  includedTags={searchTags}
                  onIncludedTagsChange={handleSearchTagsChange}
                  excludedTags={excludedTags}
                  onExcludedTagsChange={handleExcludedTagsChange}
                  availableTags={availableTags}
                  isLoading={tagsLoading}
                />
              )
          }

          {extraFilters}
          {personalizationContext && <QuickTagsToggle open={tagsOpen} controlsId={tagsId} onOpenChange={setTagsOpen} />}
        </div>

        {
          personalizationContext && (
            <QuickTagsPanel id={tagsId} open={tagsOpen} context={personalizationContext}
              includedTags={searchTags} excludedTags={excludedTags}
              onIncludedTagsChange={handleSearchTagsChange} onExcludedTagsChange={handleExcludedTagsChange} />
          )
        }
      </div>

      {
        children && (
          <div className="flex w-full flex-wrap items-start gap-2 lg:w-auto lg:flex-none lg:justify-end">
            {children}
          </div>
        )
      }
    </div>
  );
};
