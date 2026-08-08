"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/weaponsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/common/translations';
import { WeaponDto, weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";
import { createKeysetSearchWeaponsKey } from "@/persistence/cacheKeys";
import { createWeaponKeysetQuery } from "@/infrastructure/searchQueries/equipment/weapons/createWeaponKeysetQuery";
import WeaponView from "@/application/compendium/equipment/weapons/WeaponView";
import { ulid } from "ulid";
import { CreateDefaultWeapon, Weapon, allowedStyles, Style } from "@/domain/characters/equipment/Weapon";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import StyleFilter from "@/common/components/filters/StyleFilter";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import ListHeader from "@/common/components/lists/ListHeader";
import ItemAddSheet from "@/application/common/equipment/ItemAddSheet";
import WeaponEditableFields from "@/application/common/equipment/EditSheets/WeaponEditableFields";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function WeaponsList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('weapons');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);
  const [selectedStyle, setSelectedStyle] = useState<Style | "All">("All");

  const [displayedWeapons, setDisplayedWeapons] = useState<Weapon[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = [...createKeysetSearchWeaponsKey(debouncedSearchTerm, cursor, searchTags,  pageSize, selectedStyle, excludedTags), facetFilters];
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const weaponsQuery = createWeaponKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags, selectedStyle);
      if (facetFilters.length > 0) weaponsQuery.tagFacetFilters = facetFilters;

      return await searchClient.search<Weapon[]>(weaponsQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedWeapons(searchResults);
      return;
    }

    setDisplayedWeapons(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...searchResults].map(weapon => [weapon.id, weapon])).values());
    });
  }, [cursor, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedWeapons(EMPTY_ARRAY);
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

  const handleStyleChange = useCallback((style: Style | "All") => 
  {
    setSelectedStyle(style);
    clearResults();
  }, [clearResults]);

  const handleDelete = useCallback((id: string) =>
  {
    setDisplayedWeapons(prev => prev.filter(weapon => weapon.id !== id));
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
        personalizationContext="weapons"
        facetEntity="weapons"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
      >
        <StyleFilter selectedStyle={selectedStyle} onStyleChange={handleStyleChange} styles={allowedStyles} />
        <AddWeaponForm />
      </ListHeader>

      <WithScroll<Weapon>
        parentClassName="flex flex-col gap-2"
        items={displayedWeapons}
        triggerNext={() => 
        {
          if (displayedWeapons.length > 0) setCursor(displayedWeapons[displayedWeapons.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={weapon => <WeaponView key={weapon.id} weapon={weapon} onDelete={handleDelete} />}
      />
    </>
  );
};

function AddWeaponForm()
{
  const initialValues: WeaponDto = CreateDefaultWeapon();

  const form = useForm<WeaponDto>
  ({
    resolver: typedZodResolver(weaponSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (weapon: WeaponDto) => { await client.add({ ...weapon, id: ulid() }) },
    {
      invalidateOnSuccess: ['weapons'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-weapon-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <ItemAddSheet isPending={isPending} formId={formId} title={displayedText.weapons} entityType="weapons">
          <WeaponEditableFields pathPrefix="" />
        </ItemAddSheet>
      </form>
    </Form>
  )
}
