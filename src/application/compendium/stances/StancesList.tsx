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
import { useCallback, useEffect, useState } from "react";
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
import GroupedItemsList from "@/common/components/lists/GroupedItemsList";
import { Button } from "@/ui/button";
import { List, Layers } from "lucide-react";
import { CharacterModeFilter } from "@/application/compendium/CharacterModeFilter";
import { matchesOwned, narrowToOwned, ownedFilterKey, type OwnedFilter } from "@/application/compendium/characterOwnership";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function StancesList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
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

  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const visibleStances = displayedStances;
  const [requirementFilters, setRequirementFilters] = useState<RequirementSearchFilter[]>(EMPTY_ARRAY);
  const selectedGrade = parseGradeFilterInput(debouncedGradeFilter);

  const ownedKey = ownedFilterKey(ownedFilter);
  const queryKey = [...[createOffsetSearchStancesKey(debouncedSearchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedGrade), requirementFilters, facetFilters], ownedKey];
  const { data: searchResults } = useQuery
  ({
    queryKey,
    queryFn: async () =>
    {
      const stancesQuery = createStanceOffsetQuery(debouncedSearchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedGrade);
      narrowToOwned(stancesQuery, ownedFilter, debouncedSearchTerm);
      if (requirementFilters.length > 0) stancesQuery.requirementFilters = requirementFilters;
      if (facetFilters.length > 0) stancesQuery.tagFacetFilters = facetFilters;

      return await searchClient.search<Mode[]>(stancesQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;

    // Przy filtrze postaci jedno zadanie miesci CALY jej repertuar
    // (`narrowToOwned` podnosi rozmiar strony do iloczynu rodzin i rang), wiec
    // nie ma czego doczytywac. Bez tego lista dogralaby sie dopiero przy
    // przewinieciu i strona 1 wygladala na dziwnie mala.
    setHasMore(ownedFilter ? false : searchResults.length === pageSize);
    const ownedResults = searchResults.filter(item => matchesOwned(ownedFilter, item));

    if (pageNumber === 1)
    {
      setDisplayedStances(ownedResults);
      return;
    }

    setDisplayedStances(prev => [...prev, ...ownedResults]);
  }, [pageNumber, searchResults, ownedKey]);

  const clearResults = useCallback(() =>
  {
    setDisplayedStances(EMPTY_ARRAY);
    setPageNumber(1);
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
  {
    clearResults();
    setSearchInput(e.target.value);
  }, [clearResults]);

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


  // Zmiana postaci to inny zbior wynikow: bez tego strona zostaje na

  // numerze 3, a nowe wyniki dokleily sie do starej listy.

  useEffect(() => { clearResults(); }, [ownedFilter, clearResults]);


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

  const handleScopeToGroup = useCallback((groupName: string) => {
    setSearchInput(groupName);
    clearResults();
  }, [clearResults]);

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
        extraFilters={<><RequirementFilter value={requirementFilters} onChange={handleRequirementFiltersChange} /><CharacterModeFilter kind="stances" onOwnedChange={setOwnedFilter} /></>}
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
          renderItem={stance => <StanceView key={stance.id} stance={stance} onDelete={handleDelete} />}
          triggerNext={() => {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
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
          renderItem={stance => <StanceView key={stance.id} stance={stance} onDelete={handleDelete} />}
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
