"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/stancesClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/common/translations';
import { AddModeDto, addModeSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import { createOffsetSearchStancesKey } from "@/persistence/cacheKeys";
import { createStanceOffsetQuery } from "@/infrastructure/searchQueries/stances/createStanceOffsetQuery";
import StanceView from "@/application/compendium/stances/StanceView";
import { ulid } from "ulid";
import { CreateDefaultStance, Mode } from "@/domain/characters/combat/Mode";
import { useCallback, useState } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { normalizeGradeFilterInput, parseGradeFilterInput } from "@/common/global/gradeFilter";
import { DEFAULT_PAGE_SIZE } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import ListHeader from "@/common/components/lists/ListHeader";
import PerkableAddSheet from "@/application/common/PerkableAddSheet";
import RequirementFilter from "@/application/common/requirements/RequirementFilter";
import type { RequirementSearchFilter } from "@/common/global/SearchPayloads";
import { narrowToGroup, useGroupedNameSearch } from "@/application/compendium/useGroupedNameSearch";
import GroupedItemsList from "@/common/components/lists/GroupedItemsList";
import { Button } from "@/ui/button";
import { List, Layers } from "lucide-react";
import { narrowToOwned } from '@/application/compendium/characterOwnership';
import { CharacterOwnedFilter, useCharacterOwnedFilter } from '@/application/compendium/character-scope/CharacterOwnedFilter';

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function StancesList()
{
  const [gradeFilter, setGradeFilter] = useState("");
  const [debouncedGradeFilter] = useDebounce(gradeFilter, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('stances');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);
  const [isGroupedView, setIsGroupedView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('stances-grouped-view') === 'true';
    }
    return false;
  });

  const [displayedStances, setDisplayedStances] = useState<Mode[]>(EMPTY_ARRAY);

  const { filter: ownedFilter, key: ownedKey } = useCharacterOwnedFilter('stances');
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const { searchInput, searchTerm, groupName, handleSearchInputChange, handleScopeToGroup } = useGroupedNameSearch(setPageNumber);
  const visibleStances = displayedStances;
  const [requirementFilters, setRequirementFilters] = useState<RequirementSearchFilter[]>(EMPTY_ARRAY);
  const selectedGrade = parseGradeFilterInput(debouncedGradeFilter);

  const [previousOwnedKey, setPreviousOwnedKey] = useState(ownedKey);
  // Adjust during render so a cached page from the old scope cannot be appended.
  if (previousOwnedKey !== ownedKey) {
    setPreviousOwnedKey(ownedKey);
    setPageNumber(1);
    setDisplayedStances([]);
    setHasMore(true);
  }

  const queryKey = [...[createOffsetSearchStancesKey(searchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedGrade), requirementFilters, facetFilters], ownedKey, ...(groupName === null ? [] : [groupName])];
  const { data: searchResults } = useQuery
  ({
    queryKey,
    queryFn: async () =>
    {
      const stancesQuery = createStanceOffsetQuery(searchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedGrade);
      narrowToOwned(stancesQuery, ownedFilter);
      narrowToGroup(stancesQuery, groupName);
      if (requirementFilters.length > 0) stancesQuery.requirementFilters = requirementFilters;
      if (facetFilters.length > 0) stancesQuery.tagFacetFilters = facetFilters;

      if (ownedFilter?.values.length === 0) return [];
      return await searchClient.search<Mode[]>(stancesQuery);
    },
    staleTime: 5_000
  });

  const [previousPage, setPreviousPage] = useState<{ pageNumber: typeof pageNumber; searchResults: typeof searchResults; ownedKey: typeof ownedKey } | null>(null);
  if (searchResults && (!previousPage || previousPage.pageNumber !== pageNumber || previousPage.searchResults !== searchResults || previousPage.ownedKey !== ownedKey))
  {
    setPreviousPage({ pageNumber, searchResults, ownedKey });
    setHasMore(searchResults.length === pageSize);
    const ownedResults = searchResults;
    if (pageNumber === 1)
    {
      setDisplayedStances(ownedResults);
    }
    else
    {
      setDisplayedStances(prev => Array.from(new Map([...prev, ...ownedResults].map(item => [item.id, item])).values()));
    }
  }

  const clearResults = useCallback(() =>
  {
    setDisplayedStances(EMPTY_ARRAY);
    setPageNumber(1);
  }, []);

  const handleGradeFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
  {
    clearResults();
    setGradeFilter(normalizeGradeFilterInput(e.target.value));
  }, [clearResults]);

  const handleFacetFiltersChange = useCallback((filters: TagFacetFilter[]) =>

  {

    setFacetFilters(filters);

    clearResults();

  }, [clearResults]);




  const handleSearchTagsChange = useCallback((tags: string[]) => 
  {
    setSearchTags(tags);
    clearResults();
  }, [clearResults]);

  const handleExcludedTagsChange = useCallback((tags: string[]) =>
  {
    setExcludedTags(tags);
    clearResults();
  }, [clearResults]);

  const handleRequirementFiltersChange = useCallback((filters: RequirementSearchFilter[]) =>
  {
    setRequirementFilters(filters);
    clearResults();
  }, [clearResults]);

  const handleDelete = useCallback((id: string) =>
  {
    setDisplayedStances(prev => prev.filter(stance => stance.id !== id));
  }, []);

  const toggleViewMode = useCallback(() => {
    setIsGroupedView(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('stances-grouped-view', String(newValue));
      }
      return newValue;
    });
  }, []);

  return (
    <>
      <ListHeader
        searchInput={searchInput}
        handleSearchInputChange={handleSearchInputChange}
        gradeFilter={gradeFilter}
        handleGradeFilterChange={handleGradeFilterChange}
        searchTags={searchTags}
        handleSearchTagsChange={handleSearchTagsChange}
        excludedTags={excludedTags}
        handleExcludedTagsChange={handleExcludedTagsChange}
        availableTags={availableTags}
        tagsLoading={tagsLoading}
        personalizationContext="stances"
        facetEntity="stances"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
        extraFilters={<><RequirementFilter value={requirementFilters} onChange={handleRequirementFiltersChange} /><CharacterOwnedFilter kind="stances" /></>}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleViewMode}
          title={isGroupedView ? "Switch to flat view" : "Switch to grouped view"}
        >
          {isGroupedView ? <List className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
        </Button>
        <AddStanceForm />
      </ListHeader>

      {isGroupedView ? (
        <GroupedItemsList<Mode>
          items={visibleStances}
          renderItem={stance => <StanceView characterScope key={stance.id} stance={stance} onDelete={handleDelete} />}
          triggerNext={() => {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore && !!searchResults}
          groupName={groupName}
          onScopeToGroup={handleScopeToGroup}
        />
      ) : (
        <WithScroll<Mode>
          parentClassName="flex flex-col gap-2"
          items={visibleStances}
          triggerNext={() =>
          {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
          renderItem={stance => <StanceView characterScope key={stance.id} stance={stance} onDelete={handleDelete} />}
        />
      )}
    </>
  );
};

function AddStanceForm()
{
  const initialValues: AddModeDto = CreateDefaultStance();

  const form = useForm<AddModeDto>
  ({
    resolver: typedZodResolver(addModeSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (stance: AddModeDto) => { await client.add({ ...stance, id: ulid() }) },
    {
      invalidateOnSuccess: ['stances'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-stance-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <PerkableAddSheet isPending={isPending} formId={formId} title={displayedText.addStance} entityType="stances" />
      </form>
    </Form>
  )
}
