"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/racesClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { AddRaceDto, addRaceSchema } from "@/persistence/schemas/characters/raceSchema";
import { createKeysetSearchRacesKey } from "@/persistence/cacheKeys";
import { createRaceKeysetQuery } from "@/infrastructure/searchQueries/races/createRaceKeysetQuery";
import RaceView from "@/application/compendium/races/RaceView";
import { ulid } from "ulid";
import { CreateDefaultRace, Race } from "@/domain/Race";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import ListHeader from "@/common/components/lists/ListHeader";
import RaceAddSheet from "@/application/compendium/races/RaceAddSheet";
import { displayedText } from "@/common/translations";
import { narrowToOwned } from '@/application/compendium/characterOwnership';
import { CharacterOwnedFilter, useCharacterOwnedFilter } from '@/application/compendium/character-scope/CharacterOwnedFilter';
import { useSearchParams } from "next/navigation";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function RacesList()
{
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || "";
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('races');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);

  const [displayedRaces, setDisplayedRaces] = useState<Race[]>(EMPTY_ARRAY);

  const { filter: ownedFilter, key: ownedKey } = useCharacterOwnedFilter('races');
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const [previousOwnedKey, setPreviousOwnedKey] = useState(ownedKey);
  // Adjust during render so a cached page from the old scope cannot be appended.
  if (previousOwnedKey !== ownedKey) {
    setPreviousOwnedKey(ownedKey);
    setCursor(emptyUlid);
    setDisplayedRaces([]);
    setHasMore(true);
  }

  const queryKey = [...[...createKeysetSearchRacesKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags), facetFilters], ownedKey];
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const racesQuery = createRaceKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      narrowToOwned(racesQuery, ownedFilter);
      if (facetFilters.length > 0) racesQuery.tagFacetFilters = facetFilters;

      if (ownedFilter?.values.length === 0) return [];
      return await searchClient.search<Race[]>(racesQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;

    setHasMore(searchResults.length === pageSize);
    const ownedResults = searchResults;

    if (cursor === emptyUlid)
    {
      setDisplayedRaces(ownedResults);
      return;
    }

    setDisplayedRaces(prev =>  
    {
      if (ownedResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...ownedResults].map(race => [race.id, race])).values());
    });
  }, [cursor, searchResults, ownedKey]);

  const clearResults = useCallback(() =>
  {
    setDisplayedRaces(EMPTY_ARRAY);
    setCursor(emptyUlid);
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
  {
    clearResults();
    setSearchInput(e.target.value);
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
    setCursor(emptyUlid);
  }, []);

  const handleDelete = useCallback((id: string) =>
  {
    setDisplayedRaces(prev => prev.filter(race => race.id !== id));
  }, []);

  return (
    <>
      <ListHeader
        searchInput={searchInput}
        handleSearchInputChange={handleSearchInputChange}
        searchTags={searchTags}
        handleSearchTagsChange={handleSearchTagsChange}
        excludedTags={excludedTags}
        handleExcludedTagsChange={handleExcludedTagsChange}
        availableTags={availableTags}
        tagsLoading={tagsLoading}
        personalizationContext="races"
        extraFilters={<CharacterOwnedFilter kind="races" />}
        facetEntity="races"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
      >
        <AddRaceForm />
      </ListHeader>

      <WithScroll<Race>
        parentClassName="flex flex-col gap-2"
        items={displayedRaces}
        triggerNext={() => 
        {
          if (displayedRaces.length > 0) setCursor(displayedRaces[displayedRaces.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={race => <RaceView characterScope key={race.id} race={race} onDelete={handleDelete} />}
      />
    </>
  );
};

function AddRaceForm()
{
  const initialValues: AddRaceDto = CreateDefaultRace();

  const form = useForm<AddRaceDto>
  ({
    resolver: typedZodResolver(addRaceSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (race: AddRaceDto) => { await client.add({ ...race, id: ulid() }) },
    {
      invalidateOnSuccess: ['races'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-race-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <RaceAddSheet isPending={isPending} formId={formId} title={displayedText.addRace} />
      </form>
    </Form>
  )
}
