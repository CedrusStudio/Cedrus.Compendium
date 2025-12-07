"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/perksClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { AddPerkDto, addPerkSchema } from "@/persistence/schemas/characters/perkSchema";
import { createKeysetSearchPerksKey } from "@/persistence/cacheKeys";
import { createPerkKeysetQuery } from "@/infrastructure/searchQueries/perks/createPerkKeysetQuery";
import PerkView from "@/application/compendium/perks/PerkView";
import { ulid } from "ulid";
import { CreateDefaultPerk, Perk } from "@/domain/characters/Perk";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import ListHeader from "@/common/components/lists/ListHeader";
import PerkableAddSheet from "@/application/common/PerkableAddSheet";
import { displayedText } from "@/common/translations";
import GroupedItemsList from "@/common/components/lists/GroupedItemsList";
import { Button } from "@/ui/button";
import { List, Layers } from "lucide-react";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function PerksList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('perks');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [isGroupedView, setIsGroupedView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('perks-grouped-view') === 'true';
    }
    return false;
  });

  const [displayedPerks, setDisplayedPerks] = useState<Perk[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchPerksKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const perksQuery = createPerkKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      return await searchClient.search<Perk[]>(perksQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedPerks(searchResults);
      return;
    }

    setDisplayedPerks(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...searchResults].map(perk => [perk.id, perk])).values());
    });
  }, [cursor, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedPerks(EMPTY_ARRAY);
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
    setDisplayedPerks(prev => prev.filter(perk => perk.id !== id));
  }, []);

  const toggleViewMode = useCallback(() => {
    setIsGroupedView(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('perks-grouped-view', String(newValue));
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
        <AddPerkForm />
      </ListHeader>

      {isGroupedView ? (
        <GroupedItemsList<Perk>
          items={displayedPerks}
          renderItem={perk => <PerkView key={perk.id} perk={perk} onDelete={handleDelete} />}
          triggerNext={() => {
            if (displayedPerks.length > 0) setCursor(displayedPerks[displayedPerks.length - 1].id);
          }}
          hasMore={hasMore}
          onScopeToGroup={handleScopeToGroup}
        />
      ) : (
        <WithScroll<Perk>
          parentClassName="flex flex-col gap-2"
          items={displayedPerks}
          triggerNext={() => 
          {
            if (displayedPerks.length > 0) setCursor(displayedPerks[displayedPerks.length - 1].id);
          }}
          hasMore={hasMore}
          renderItem={perk => <PerkView key={perk.id} perk={perk} onDelete={handleDelete} />}
        />
      )}
    </>
  );
};

function AddPerkForm()
{
  const initialValues: AddPerkDto = CreateDefaultPerk();

  const form = useForm<AddPerkDto>
  ({
    resolver: zodResolver(addPerkSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (perk: AddPerkDto) => { await client.add({ ...perk, id: ulid() }) },
    {
      invalidateOnSuccess: ['perks'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-perk-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <PerkableAddSheet isPending={isPending} formId={formId} title={displayedText.addPerk} />
      </form>
    </Form>
  )
}