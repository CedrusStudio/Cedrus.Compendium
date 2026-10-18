"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/inventoryClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { InventoryItemDto, itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";
import { createKeysetSearchInventoryKey } from "@/persistence/cacheKeys";
import { createInventoryItemKeysetQuery } from "@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery";
import InventoryItemView from "@/application/compendium/equipment/inventory/InventoryItemView";
import { ulid } from "ulid";
import { CreateDefaultInventoryItem, Item } from "@/domain/characters/equipment/Item";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import ListHeader from "@/common/components/lists/ListHeader";
import ItemAddSheet from "@/application/common/equipment/ItemAddSheet";
import { narrowToOwned } from '@/application/compendium/characterOwnership';
import { CharacterOwnedFilter, useCharacterOwnedFilter } from '@/application/compendium/character-scope/CharacterOwnedFilter';
import { displayedText } from "@/common/translations";

const pageSize = DEFAULT_PAGE_SIZE;

const EMPTY_ARRAY: never[] = [];

export default function InventoryList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('inventory');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);

  const [displayedInventory, setDisplayedInventory] = useState<Item[]>([]);

  const { filter: ownedFilter, key: ownedKey } = useCharacterOwnedFilter('inventory');
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const [previousOwnedKey, setPreviousOwnedKey] = useState(ownedKey);
  // Adjust during render so a cached page from the old scope cannot be appended.
  if (previousOwnedKey !== ownedKey) {
    setPreviousOwnedKey(ownedKey);
    setCursor(emptyUlid);
    setDisplayedInventory([]);
    setHasMore(true);
  }

  const queryKey = [...[...createKeysetSearchInventoryKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags), facetFilters], ownedKey];
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const inventoryQuery = createInventoryItemKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      narrowToOwned(inventoryQuery, ownedFilter);
      if (facetFilters.length > 0) inventoryQuery.tagFacetFilters = facetFilters;

      if (ownedFilter?.values.length === 0) return [];
      return await searchClient.search<Item[]>(inventoryQuery);
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
      setDisplayedInventory(ownedResults);
      return;
    }

    setDisplayedInventory(prev =>  
    {
      if (ownedResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...ownedResults].map(item => [item.id, item])).values());
    });
  }, [cursor, searchResults, ownedKey]);

  const clearResults = useCallback(() =>
  {
    setDisplayedInventory([]);
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
    setDisplayedInventory(prev => prev.filter(item => item.id !== id));
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
        personalizationContext="inventory"
        extraFilters={<CharacterOwnedFilter kind="inventory" />}
        facetEntity="inventory"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
      >
        <AddInventoryItemForm />
      </ListHeader>

      <WithScroll<Item>
        parentClassName="flex flex-col gap-2"
        items={displayedInventory}
        triggerNext={() => 
        {
          if (displayedInventory.length > 0) setCursor(displayedInventory[displayedInventory.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={item => <InventoryItemView characterScope key={item.id} item={item} onDelete={handleDelete} />}
      />
    </>
  );
};

function AddInventoryItemForm()
{
  const initialValues: InventoryItemDto = CreateDefaultInventoryItem();

  const form = useForm<InventoryItemDto>
  ({
    resolver: typedZodResolver(itemSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (item: InventoryItemDto) => { await client.add({ ...item, id: ulid() }) },
    {
      invalidateOnSuccess: ['inventory'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-inventory-item-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <ItemAddSheet isPending={isPending} formId={formId} title={displayedText.inventory} entityType="inventory" />
      </form>
    </Form>
  )
}
