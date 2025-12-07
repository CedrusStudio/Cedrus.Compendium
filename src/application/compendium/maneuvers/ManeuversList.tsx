"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/maneuversClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/common/translations';
import { AddManeuverDto, addManeuverSchema, ManeuverDto } from "@/persistence/schemas/characters/combat/maneuverSchema";
import { createKeysetSearchManeuversKey } from "@/persistence/cacheKeys";
import { createManeuverKeysetQuery } from "@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery";
import ManeuverView from "@/application/compendium/maneuvers/ManeuverView";
import { ulid } from "ulid";
import { CreateDefaultManeuver, Maneuver } from "@/domain/characters/combat/Maneuver";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import ListHeader from "@/common/components/lists/ListHeader";
import PerkableAddSheet from "@/application/common/PerkableAddSheet";
import GroupedItemsList from "@/common/components/lists/GroupedItemsList";
import { Button } from "@/ui/button";
import { List, Layers } from "lucide-react";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function ManeuversList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('maneuvers');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [isGroupedView, setIsGroupedView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('maneuvers-grouped-view') === 'true';
    }
    return false;
  });

  const [displayedManeuvers, setDisplayedManeuvers] = useState<Maneuver[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchManeuversKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const maneuversQuery = createManeuverKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      return await searchClient.search<Maneuver[]>(maneuversQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedManeuvers(searchResults);
      return;
    }

    setDisplayedManeuvers(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...searchResults].map(maneuver => [maneuver.id, maneuver])).values());
    });
  }, [cursor, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedManeuvers(EMPTY_ARRAY);
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
    setDisplayedManeuvers(prev => prev.filter(maneuver => maneuver.id !== id));
  }, []);

  const toggleViewMode = useCallback(() => {
    setIsGroupedView(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('maneuvers-grouped-view', String(newValue));
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
        <AddManeuverForm />
      </ListHeader>

      {isGroupedView ? (
        <GroupedItemsList<Maneuver>
          items={displayedManeuvers}
          renderItem={maneuver => <ManeuverView key={maneuver.id} maneuver={maneuver} onDelete={handleDelete} />}
          triggerNext={() => {
            if (displayedManeuvers.length > 0) setCursor(displayedManeuvers[displayedManeuvers.length - 1].id);
          }}
          hasMore={hasMore}
          onScopeToGroup={handleScopeToGroup}
        />
      ) : (
        <WithScroll<Maneuver>
          parentClassName="flex flex-col gap-2"
          items={displayedManeuvers}
          triggerNext={() => 
          {
            if (displayedManeuvers.length > 0) setCursor(displayedManeuvers[displayedManeuvers.length - 1].id);
          }}
          hasMore={hasMore}
          renderItem={maneuver => <ManeuverView key={maneuver.id} maneuver={maneuver} onDelete={handleDelete} />}
        />
      )}
    </>
  );
};

function AddManeuverForm()
{
  const initialValues: AddManeuverDto = CreateDefaultManeuver();

  const form = useForm<AddManeuverDto>
  ({
    resolver: zodResolver(addManeuverSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (maneuver: AddManeuverDto) => { await client.add({ ...maneuver, id: ulid() }) },
    {
      invalidateOnSuccess: ['maneuvers'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-maneuver-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <PerkableAddSheet isPending={isPending} formId={formId} title={displayedText.addManeuver} >
          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
              <InputFormField<ManeuverDto> path='cooldown' inputClassName='w-11 h-10 text-center font-medium' />
            </div>

            <div className="flex flex-col items-center gap-3 px-4">
              <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
              <SelectFormField<ManeuverDto> path='castTime' labelText={displayedText.castTime} items={allowedCastTimes} />
            </div>

          </div>
        </PerkableAddSheet>
      </form>
    </Form>
  )
}

