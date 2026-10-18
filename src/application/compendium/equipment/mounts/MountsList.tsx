"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/mountsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/common/translations';
import { MountDto, mountSchema } from "@/persistence/schemas/characters/equipment/mountSchema";
import { createKeysetSearchMountsKey } from "@/persistence/cacheKeys";
import { createMountKeysetQuery } from "@/infrastructure/searchQueries/equipment/mounts/createMountKeysetQuery";
import MountView from "@/application/compendium/equipment/mounts/MountView";
import { ulid } from "ulid";
import { CreateDefaultMount, Mount } from "@/domain/characters/equipment/Mount";
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
import MountEditableFields from "@/application/common/equipment/EditSheets/MountEditableFields";

const pageSize = DEFAULT_PAGE_SIZE;

const EMPTY_ARRAY: never[] = [];

export default function MountsList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('mounts');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);

  const [displayedMounts, setDisplayedMounts] = useState<Mount[]>([]);

  const { filter: ownedFilter, key: ownedKey } = useCharacterOwnedFilter('mounts');
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const [previousOwnedKey, setPreviousOwnedKey] = useState(ownedKey);
  // Adjust during render so a cached page from the old scope cannot be appended.
  if (previousOwnedKey !== ownedKey) {
    setPreviousOwnedKey(ownedKey);
    setCursor(emptyUlid);
    setDisplayedMounts([]);
    setHasMore(true);
  }

  const queryKey = [...[...createKeysetSearchMountsKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags), facetFilters], ownedKey];
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const mountsQuery = createMountKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      narrowToOwned(mountsQuery, ownedFilter);
      if (facetFilters.length > 0) mountsQuery.tagFacetFilters = facetFilters;

      if (ownedFilter?.values.length === 0) return [];
      return await searchClient.search<Mount[]>(mountsQuery);
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
      setDisplayedMounts(ownedResults);
      return;
    }

    setDisplayedMounts(prev =>  
    {
      if (ownedResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...ownedResults].map(mount => [mount.id, mount])).values());
    });
  }, [cursor, searchResults, ownedKey]);

  const clearResults = useCallback(() =>
  {
    setDisplayedMounts([]);
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
    setDisplayedMounts(prev => prev.filter(mount => mount.id !== id));
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
        personalizationContext="mounts"
        extraFilters={<CharacterOwnedFilter kind="mounts" />}
        facetEntity="mounts"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
      >
        <AddMountForm />
      </ListHeader>

      <WithScroll<Mount>
        parentClassName="flex flex-col gap-2"
        items={displayedMounts}
        triggerNext={() => 
        {
          if (displayedMounts.length > 0) setCursor(displayedMounts[displayedMounts.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={mount => <MountView characterScope key={mount.id} mount={mount} onDelete={handleDelete} />}
      />
    </>
  );
};

function AddMountForm()
{
  const initialValues: MountDto = CreateDefaultMount();

  const form = useForm<MountDto>
  ({
    resolver: typedZodResolver(mountSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (mount: MountDto) => { await client.add({ ...mount, id: ulid() }) },
    {
      invalidateOnSuccess: ['mounts'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-mount-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <ItemAddSheet isPending={isPending} formId={formId} title={displayedText.mounts} entityType="mounts">
          <MountEditableFields />
        </ItemAddSheet>
      </form>
    </Form>
  )
}