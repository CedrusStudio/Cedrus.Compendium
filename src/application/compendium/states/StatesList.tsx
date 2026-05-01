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
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE } from "@/common/global/pagination";
import { useQuery } from "@tanstack/react-query";
import { useEntityTags } from "@/common/hooks/useEntityTags";
import ListHeader from "@/common/components/lists/ListHeader";
import PerkableAddSheet from "@/application/common/PerkableAddSheet";
import GroupedItemsList from "@/common/components/lists/GroupedItemsList";
import { Button } from "@/ui/button";
import { List, Layers } from "lucide-react";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function StatesList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('states');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [isGroupedView, setIsGroupedView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('states-grouped-view') === 'true';
    }
    return false;
  });

  const [displayedStates, setDisplayedStates] = useState<Mode[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  const queryKey = createOffsetSearchStatesKey(debouncedSearchTerm, pageNumber, searchTags, pageSize, excludedTags);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const statesQuery = createStateOffsetQuery(debouncedSearchTerm, pageNumber, searchTags, pageSize, excludedTags);
      return await searchClient.search<Mode[]>(statesQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (pageNumber === 1)
    {
      setDisplayedStates(searchResults);
      return;
    }

    setDisplayedStates(prev => [...prev, ...searchResults]);
  }, [pageNumber, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedStates(EMPTY_ARRAY);
    setPageNumber(1);
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

  const handleScopeToGroup = useCallback((groupName: string) => {
    setSearchInput(groupName);
    clearResults();
  }, [clearResults]);

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
          items={displayedStates}
          renderItem={state => <StateView key={state.id} state={state} onDelete={handleDelete} />}
          triggerNext={() => {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
          onScopeToGroup={handleScopeToGroup}
        />
      ) : (
        <WithScroll<Mode>
          parentClassName="flex flex-col gap-2"
          items={displayedStates}
          triggerNext={() => 
          {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
          renderItem={state => <StateView key={state.id} state={state} onDelete={handleDelete} />}
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
