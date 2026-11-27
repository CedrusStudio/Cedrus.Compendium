"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/statesClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/common/translations';
import { AddModeDto, addModeSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import { createOffsetSearchStatesKey } from "@/persistence/cacheKeys";
import { createStateOffsetQuery } from "@/infrastructure/searchQueries/states/createStateOffsetQuery";
import StateView from "@/application/compendium/states/StateView";
import { ulid } from "ulid";
import { CreateDefaultState, Mode } from "@/domain/characters/combat/Mode";
import { useState, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useDebounce } from "use-debounce";
import { normalizeGradeFilterInput, parseGradeFilterInput } from "@/common/global/gradeFilter";
import { DEFAULT_PAGE_SIZE } from "@/common/global/pagination";
import { useQuery } from "@tanstack/react-query";
import { useEntityTags } from "@/common/hooks/useEntityTags";
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

export default function StatesList()
{
  const [gradeFilter, setGradeFilter] = useState("");
  const [debouncedGradeFilter] = useDebounce(gradeFilter, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('states');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);
  const [isGroupedView, setIsGroupedView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('states-grouped-view') === 'true';
    }
    return false;
  });

  const [displayedStates, setDisplayedStates] = useState<Mode[]>(EMPTY_ARRAY);

  const { filter: ownedFilter, key: ownedKey } = useCharacterOwnedFilter('states');
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const { searchInput, searchTerm, groupName, handleSearchInputChange, handleScopeToGroup } = useGroupedNameSearch(setPageNumber);
  const visibleStates = displayedStates;
  const [requirementFilters, setRequirementFilters] = useState<RequirementSearchFilter[]>(EMPTY_ARRAY);
  const selectedGrade = parseGradeFilterInput(debouncedGradeFilter);

  const [previousOwnedKey, setPreviousOwnedKey] = useState(ownedKey);
  // Adjust during render so a cached page from the old scope cannot be appended.
  if (previousOwnedKey !== ownedKey) {
    setPreviousOwnedKey(ownedKey);
    setPageNumber(1);
    setDisplayedStates([]);
    setHasMore(true);
  }

  const queryKey = [...[createOffsetSearchStatesKey(searchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedGrade), requirementFilters, facetFilters], ownedKey, ...(groupName === null ? [] : [groupName])];
  const { data: searchResults } = useQuery
  ({
    queryKey,
    queryFn: async () =>
    {
      const statesQuery = createStateOffsetQuery(searchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedGrade);
      narrowToOwned(statesQuery, ownedFilter);
      narrowToGroup(statesQuery, groupName);
      if (requirementFilters.length > 0) statesQuery.requirementFilters = requirementFilters;
      if (facetFilters.length > 0) statesQuery.tagFacetFilters = facetFilters;

      if (ownedFilter?.values.length === 0) return [];
      return await searchClient.search<Mode[]>(statesQuery);
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
      setDisplayedStates(ownedResults);
    }
    else
    {
      setDisplayedStates(prev => Array.from(new Map([...prev, ...ownedResults].map(item => [item.id, item])).values()));
    }
  }

  const clearResults = useCallback(() =>
  {
    setDisplayedStates(EMPTY_ARRAY);
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
    setDisplayedStates(prev => prev.filter(state => state.id !== id));
  }, []);

  const toggleViewMode = useCallback(() => {
    setIsGroupedView(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('states-grouped-view', String(newValue));
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
        personalizationContext="states"
        facetEntity="states"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
        extraFilters={<><RequirementFilter value={requirementFilters} onChange={handleRequirementFiltersChange} /><CharacterOwnedFilter kind="states" /></>}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={toggleViewMode}
          title={isGroupedView ? "Switch to flat view" : "Switch to grouped view"}
        >
          {isGroupedView ? <List className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
        </Button>
        <AddStateForm />
      </ListHeader>

      {isGroupedView ? (
        <GroupedItemsList<Mode>
          items={visibleStates}
          renderItem={state => <StateView characterScope key={state.id} state={state} onDelete={handleDelete} />}
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
          items={visibleStates}
          triggerNext={() =>
          {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
          renderItem={state => <StateView characterScope key={state.id} state={state} onDelete={handleDelete} />}
        />
      )}
    </>
  );
};function AddStateForm()
{
  const initialValues: AddModeDto = CreateDefaultState();

  const form = useForm<AddModeDto>
  ({
    resolver: typedZodResolver(addModeSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (state: AddModeDto) => { await client.add({ ...state, id: ulid() }) },
    {
      invalidateOnSuccess: ['states'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-state-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <PerkableAddSheet isPending={isPending} formId={formId} title={displayedText.addState} entityType="states" />
      </form>
    </Form>
  )
}
