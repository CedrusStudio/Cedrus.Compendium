"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/shieldsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/common/translations';
import { ShieldDto, shieldSchema } from "@/persistence/schemas/characters/equipment/shieldSchema";
import { createKeysetSearchShieldsKey } from "@/persistence/cacheKeys";
import { createShieldKeysetQuery } from "@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery";
import ShieldView from "@/application/compendium/equipment/shields/ShieldView";
import { ulid } from "ulid";
import { CreateDefaultShield, Shield } from "@/domain/characters/equipment/Shield";
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
import ShieldEditableFields from "@/application/common/equipment/EditSheets/ShieldEditableFields";

const pageSize = DEFAULT_PAGE_SIZE;

const EMPTY_ARRAY: never[] = [];

export default function ShieldsList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('shields');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);

  const [displayedShields, setDisplayedShields] = useState<Shield[]>([]);

  const { filter: ownedFilter, key: ownedKey } = useCharacterOwnedFilter('shields');
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const [previousOwnedKey, setPreviousOwnedKey] = useState(ownedKey);
  // Adjust during render so a cached page from the old scope cannot be appended.
  if (previousOwnedKey !== ownedKey) {
    setPreviousOwnedKey(ownedKey);
    setCursor(emptyUlid);
    setDisplayedShields([]);
    setHasMore(true);
  }

  const queryKey = [...[...createKeysetSearchShieldsKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags), facetFilters], ownedKey];
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const shieldsQuery = createShieldKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      narrowToOwned(shieldsQuery, ownedFilter);
      if (facetFilters.length > 0) shieldsQuery.tagFacetFilters = facetFilters;

      if (ownedFilter?.values.length === 0) return [];
      return await searchClient.search<Shield[]>(shieldsQuery);
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
      setDisplayedShields(ownedResults);
      return;
    }

    setDisplayedShields(prev =>  
    {
      if (ownedResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...ownedResults].map(shield => [shield.id, shield])).values());
    });
  }, [cursor, searchResults, ownedKey]);

  const clearResults = useCallback(() =>
  {
    setDisplayedShields([]);
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
    setDisplayedShields(prev => prev.filter(shield => shield.id !== id));
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
        personalizationContext="shields"
        extraFilters={<CharacterOwnedFilter kind="shields" />}
        facetEntity="shields"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
      >
        <AddShieldForm />
      </ListHeader>

      <WithScroll<Shield>
        parentClassName="flex flex-col gap-2"
        items={displayedShields}
        triggerNext={() => 
        {
          if (displayedShields.length > 0) setCursor(displayedShields[displayedShields.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={shield => <ShieldView characterScope key={shield.id} shield={shield} onDelete={handleDelete} />}
      />
    </>
  );
};

function AddShieldForm()
{
  const initialValues: ShieldDto = CreateDefaultShield();

  const form = useForm<ShieldDto>
  ({
    resolver: typedZodResolver(shieldSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (shield: ShieldDto) => { await client.add({ ...shield, id: ulid() }) },
    {
      invalidateOnSuccess: ['shields'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-shield-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <ItemAddSheet isPending={isPending} formId={formId} title={displayedText.shields} entityType="shields">
          <ShieldEditableFields />
        </ItemAddSheet>
      </form>
    </Form>
  )
}
