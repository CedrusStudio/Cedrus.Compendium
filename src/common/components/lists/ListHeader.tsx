"use client";

import { displayedText } from '@/common/translations';
import { Input } from "@/common/components/ui/input";
import TagFilter from "@/common/components/filters/TagFilter";
import PersonalizedQuickTags from '@/application/personalization/PersonalizedQuickTags';
import { PersonalizationContext } from '@/persistence/slices/personalizationSlice';

type ListHeaderProps = 
{
  searchInput: string;
  handleSearchInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    <div className='flex md:ml-12 sm:flex-row gap-2 sm:gap-2 lg:gap-4 m-3 place-items-center sticky top-0 bg-background z-10'>
      <div className="flex flex-col gap-2 sm:gap-2 lg:gap-4 place-items-start">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 lg:gap-4 place-items-start">
          <Input 
            name="search" 
            type="text" 
            placeholder={displayedText.searchByName}
            value={searchInput}
            onChange={handleSearchInputChange}
            className="max-w-max"
            />

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
            <PersonalizedQuickTags
              context={personalizationContext}
              selectedTags={searchTags}
              onSelectedTagsChange={handleSearchTagsChange}
            />
          )
        }
      </div>
      {children}
    </div>
  );
};