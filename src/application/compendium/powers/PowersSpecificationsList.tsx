"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/powerSpecificationsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/common/translations';
import { AddPowerSpecificationDto, addPowerSpecificationSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import { createKeysetSearchPowerSpecificationsKey } from "@/persistence/cacheKeys";
import { ulid } from "ulid";
import { CreateDefaultPowerSpecification, PowerSpecification } from "@/domain/characters/combat/Power";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import ListHeader from "@/common/components/lists/ListHeader";
import { createPowerSpecificationKeysetQuery } from "@/infrastructure/searchQueries/powers/createPowerSpecificationKeysetQuery";
import PowersSpecificationView from "@/application/compendium/powers/PowerSpecificationView";
import PowerSpecificationEditableFields from "@/application/common/combat/PowerSpecificationEditableFields";
import { CharacterModeFilter } from "@/application/compendium/CharacterModeFilter";
import { matchesOwned, narrowToOwned, ownedFilterKey, type OwnedFilter } from "@/application/compendium/characterOwnership";
import AddSheet from "@/common/components/sheets/AddSheet";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function PowersSpecificationList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('powerSpecifications');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);

  const [displayedPowerSpecifications, setDisplayedPowerSpecifications] = useState<PowerSpecification[]>(EMPTY_ARRAY);

  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const ownedKey = ownedFilterKey(ownedFilter);
  const queryKey = [...[...createKeysetSearchPowerSpecificationsKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags), facetFilters], ownedKey];
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const powerSpecificationsQuery = createPowerSpecificationKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      narrowToOwned(powerSpecificationsQuery, ownedFilter, debouncedSearchTerm);
      if (facetFilters.length > 0) powerSpecificationsQuery.tagFacetFilters = facetFilters;

      return await searchClient.search<PowerSpecification[]>(powerSpecificationsQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;

    // Przy filtrze postaci jedno zadanie miesci CALY jej repertuar
    // (`narrowToOwned` podnosi rozmiar strony do iloczynu rodzin i rang), wiec
    // nie ma czego doczytywac. Bez tego lista dogralaby sie dopiero przy
    // przewinieciu i strona 1 wygladala na dziwnie mala.
    setHasMore(ownedFilter ? false : searchResults.length === pageSize);
    const ownedResults = searchResults.filter(item => matchesOwned(ownedFilter, item));

    if (cursor === emptyUlid)
    {
      setDisplayedPowerSpecifications(ownedResults);
      return;
    }

    setDisplayedPowerSpecifications(prev =>  
    {
      if (ownedResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...ownedResults].map(spec => [spec.id, spec])).values());
    });
  }, [cursor, searchResults, ownedKey]);

  const clearResults = useCallback(() =>
  {
    setDisplayedPowerSpecifications(EMPTY_ARRAY);
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


  // Zmiana postaci to inny zbior wynikow: bez tego strona zostaje na

  // numerze 3, a nowe wyniki dokleily sie do starej listy.

  useEffect(() => { clearResults(); }, [ownedFilter, clearResults]);


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
    setDisplayedPowerSpecifications(prev => prev.filter(spec => spec.id !== id));
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
        personalizationContext="powers"
        extraFilters={<CharacterModeFilter kind="powerSpecifications" onOwnedChange={setOwnedFilter} />}
        facetEntity="powerSpecifications"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
      >
        <AddPowerSpecificationForm />
      </ListHeader>

      <WithScroll<PowerSpecification>
        parentClassName="flex flex-col gap-2"
        items={displayedPowerSpecifications}
        triggerNext={() => 
        {
          if (displayedPowerSpecifications.length > 0) setCursor(displayedPowerSpecifications[displayedPowerSpecifications.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={powerSpecification => <PowersSpecificationView key={powerSpecification.id} powerSpecification={powerSpecification} onDelete={handleDelete} />}
      />
    </>
  );
};

function AddPowerSpecificationForm()
{
  const initialValues: AddPowerSpecificationDto = CreateDefaultPowerSpecification();

  const form = useForm<AddPowerSpecificationDto>
  ({
    resolver: typedZodResolver(addPowerSpecificationSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (powerSpecification: AddPowerSpecificationDto) => { await client.add({ ...powerSpecification, id: ulid() }) },
    {
      invalidateOnSuccess: ['powerSpecifications'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-power-specification-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <PowerSpecificationAddSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

type PowerSpecificationAddSheetProps =
{
  isPending: boolean;
  formId: string;
}

function PowerSpecificationAddSheet({ isPending, formId }: PowerSpecificationAddSheetProps)
{
  return (
    <AddSheet isPending={isPending} formId={formId} title={displayedText.addPowerSpecification}>
      <PowerSpecificationEditableFields />
    </AddSheet>
  )
}
