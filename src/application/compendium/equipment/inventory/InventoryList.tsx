"use client";

import { useListFilters } from "@cedrusstudio/react-filters";
import { hashKey, useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { useState } from "react";
import { ulid } from "ulid";
import { Button } from "@/ui/button";
import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/inventoryClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { InventoryItemDto, itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";
import { createKeysetSearchInventoryKey } from "@/persistence/cacheKeys";
import { createInventoryItemKeysetQuery } from "@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery";
import InventoryItemView from "@/application/compendium/equipment/inventory/InventoryItemView";
import { CreateDefaultInventoryItem, type Item } from "@/domain/characters/equipment/Item";
import { WithScroll } from "@/common/components/WithScroll";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from "@/common/hooks/useEntityTags";
import type { TagFacetFilter } from "@/domain/tags/tagFacets";
import ListHeader from "@/common/components/lists/ListHeader";
import ItemAddSheet from "@/application/common/equipment/ItemAddSheet";
import { narrowToOwned } from "@/application/compendium/characterOwnership";
import { CharacterOwnedFilter, useCharacterOwnedFilter } from "@/application/compendium/character-scope/CharacterOwnedFilter";
import { displayedText } from "@/common/translations";

type InventoryFilters = {
  searchInput: string;
  searchTags: string[];
  excludedTags: string[];
  facetFilters: TagFacetFilter[];
};

const initialFilters: InventoryFilters = {
  searchInput: "",
  searchTags: [],
  excludedTags: [],
  facetFilters: [],
};

type InventoryPage = { items: Item[]; nextCursor: string | undefined };

function selectInventoryItems({ pages }: InfiniteData<InventoryPage>)
{
  return Array.from(new Map(pages.flatMap(page => page.items).map(item => [item.id, item])).values());
}

export default function InventoryList()
{
  const queryClient = useQueryClient();
  const { filters, setFilters } = useListFilters(initialFilters);
  const { searchInput, searchTags, excludedTags, facetFilters } = filters;
  const searchTerm = searchInput.trim();
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const waitingForSearch = searchTerm !== debouncedSearchTerm;
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags("inventory");
  const { filter: ownedFilter, key: ownedKey } = useCharacterOwnedFilter("inventory");
  const criteriaKey = [
    ...createKeysetSearchInventoryKey(debouncedSearchTerm, emptyUlid, searchTags, DEFAULT_PAGE_SIZE, excludedTags),
    "infinite", facetFilters, ownedKey,
  ];
  const criteria = hashKey(criteriaKey);
  const [list, setList] = useState({ criteria, revision: 0 });
  if (list.criteria !== criteria)
  {
    // Returning to a previous filter still starts with its first cursor.
    setList({ criteria, revision: list.revision + 1 });
  }
  const queryKey = [...criteriaKey, list.revision];
  const inventory = useInfiniteQuery({
    queryKey,
    enabled: !waitingForSearch,
    initialPageParam: emptyUlid as string,
    queryFn: async ({ pageParam }): Promise<InventoryPage> =>
    {
      if (ownedFilter?.values.length === 0) return { items: [], nextCursor: undefined };
      const query = createInventoryItemKeysetQuery(debouncedSearchTerm, pageParam, searchTags, DEFAULT_PAGE_SIZE, excludedTags);
      narrowToOwned(query, ownedFilter);
      if (facetFilters.length > 0) query.tagFacetFilters = facetFilters;

      const items = await searchClient.search<Item[]>(query);
      return { items, nextCursor: items.length === DEFAULT_PAGE_SIZE ? items.at(-1)?.id : undefined };
    },
    getNextPageParam: lastPage => lastPage.nextCursor,
    select: selectInventoryItems,
    staleTime: 5_000,
  });

  const handleDelete = (id: string) =>
  {
    queryClient.setQueryData<InfiniteData<InventoryPage>>(queryKey, data => data && ({
      ...data,
      pages: data.pages.map(page => ({ ...page, items: page.items.filter(item => item.id !== id) })),
    }));
  };

  const isLoading = waitingForSearch || inventory.isPending;

  return (
    <>
      <ListHeader
        searchInput={searchInput}
        handleSearchInputChange={event => {
          const value = event.currentTarget.value;
          setFilters(current => ({ ...current, searchInput: value }));
        }}
        searchTags={searchTags}
        handleSearchTagsChange={tags => setFilters(current => ({ ...current, searchTags: tags }))}
        excludedTags={excludedTags}
        handleExcludedTagsChange={tags => setFilters(current => ({ ...current, excludedTags: tags }))}
        availableTags={availableTags}
        tagsLoading={tagsLoading}
        personalizationContext="inventory"
        extraFilters={<CharacterOwnedFilter kind="inventory" />}
        facetEntity="inventory"
        facetFilters={facetFilters}
        handleFacetFiltersChange={facets => setFilters(current => ({ ...current, facetFilters: facets }))}
      >
        <AddInventoryItemForm />
      </ListHeader>

      {isLoading && <p role="status" className="px-2 py-4 text-center">{displayedText.loading}</p>}
      {!isLoading && inventory.isError && (
        <div className="flex items-center justify-center gap-2 py-4">
          <p role="alert">{displayedText.error}</p>
          <Button type="button" variant="outline" onClick={() => void (
            inventory.isFetchNextPageError ? inventory.fetchNextPage() : inventory.refetch()
          )}>
            {displayedText.compendium_retry}
          </Button>
        </div>
      )}
      {!isLoading && !inventory.isError && inventory.data?.length === 0 && (
        <p role="status" className="px-2 py-4 text-center">{displayedText.notFound}</p>
      )}
      {!isLoading && inventory.data && inventory.data.length > 0 && (
        <WithScroll<Item>
          key={list.revision}
          parentClassName="flex flex-col gap-2"
          items={inventory.data}
          triggerNext={() => {
            if (!inventory.isFetching && !inventory.isError) void inventory.fetchNextPage();
          }}
          hasMore={inventory.hasNextPage && !inventory.isError}
          renderItem={item => <InventoryItemView characterScope key={item.id} item={item} onDelete={handleDelete} />}
        />
      )}
    </>
  );
}


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
