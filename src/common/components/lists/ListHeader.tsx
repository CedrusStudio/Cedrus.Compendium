"use client";

import { displayedText } from '@/common/translations';
import { Input } from "@/common/components/ui/input";
import TagFilter from "@/common/components/filters/TagFilter";
import PersonalizedQuickTags from '@/application/personalization/PersonalizedQuickTags';
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
  }
  : React.PropsWithChildren<ListHeaderProps>)
{
  return (
    <div className='sticky top-0 z-10 m-3 flex flex-col gap-2 bg-background md:ml-12 lg:flex-row lg:items-start lg:justify-between'>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2 lg:gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start lg:gap-4">
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
                className="w-full sm:max-w-28"
              />
            )
          }

          <TagFilter 
            includedTags={searchTags} 
            onIncludedTagsChange={handleSearchTagsChange} 
            excludedTags={excludedTags}
            onExcludedTagsChange={handleExcludedTagsChange}
            availableTags={availableTags} 
            isLoading={tagsLoading} 
          />
        </div>

        {
          personalizationContext && (
            <div className="space-y-2">
              <PersonalizedQuickTags
                context={personalizationContext}
                selectedTags={searchTags}
                onSelectedTagsChange={handleSearchTagsChange}
              />
              <PersonalizedQuickTags
                context={personalizationContext}
                mode="exclude"
                selectedTags={excludedTags}
                onSelectedTagsChange={handleExcludedTagsChange}
              />
            </div>
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