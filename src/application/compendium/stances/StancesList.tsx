"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/stancesClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/common/translations';
import { AddModeDto, addModeSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import { createKeysetSearchStancesKey } from "@/persistence/cacheKeys";
import { createStanceKeysetQuery } from "@/infrastructure/searchQueries/stances/createStanceKeysetQuery";
import StanceView from "@/application/compendium/stances/StanceView";
import { ulid } from "ulid";
import { CreateDefaultStance, Mode } from "@/domain/characters/combat/Mode";
import { useCallback, useEffect, useState } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import ListHeader from "@/common/components/lists/ListHeader";
import PerkableAddSheet from "@/application/common/PerkableAddSheet";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function StancesList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('stances');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);

  const [displayedStances, setDisplayedStances] = useState<Mode[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchStancesKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const stancesQuery = createStanceKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      return await searchClient.search<Mode[]>(stancesQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedStances(searchResults);
      return;
    }

    setDisplayedStances(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return [...prev, ...searchResults]
    });
  }, [cursor, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedStances(EMPTY_ARRAY);
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
        <AddStanceForm />
      </ListHeader>

      <WithScroll<Mode>
        parentClassName="flex flex-col gap-2"
        items={displayedStances}
        triggerNext={() => 
        {
          if (displayedStances.length > 0) setCursor(displayedStances[displayedStances.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={stance => <StanceView key={stance.id} stance={stance} />}
      />
    </>
  );
};

function AddStanceForm()
{
  const initialValues: AddModeDto = CreateDefaultStance();

  const form = useForm<AddModeDto>
  ({
    resolver: zodResolver(addModeSchema),
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
        <PerkableAddSheet isPending={isPending} formId={formId} title={displayedText.addStance} />
      </form>
    </Form>
  )
}
