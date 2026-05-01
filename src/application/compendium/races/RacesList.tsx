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
import ListHeader from "@/common/components/lists/ListHeader";
import RaceAddSheet from "@/application/compendium/races/RaceAddSheet";
import { displayedText } from "@/common/translations";
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

  const [displayedRaces, setDisplayedRaces] = useState<Race[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchRacesKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const racesQuery = createRaceKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      return await searchClient.search<Race[]>(racesQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedRaces(searchResults);
      return;
    }

    setDisplayedRaces(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...searchResults].map(race => [race.id, race])).values());
    });
  }, [cursor, searchResults]);

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
        renderItem={race => <RaceView key={race.id} race={race} onDelete={handleDelete} />}
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
