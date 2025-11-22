"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/weaponsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/presentation/translations';
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
import CompendiumListHeader from "@/application/compendium/CompendiumListHeader";
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
  const [selectedStyle, setSelectedStyle] = useState<Style | "All">("All");

  const [displayedWeapons, setDisplayedWeapons] = useState<Weapon[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchWeaponsKey(debouncedSearchTerm, cursor, searchTags,  pageSize, selectedStyle);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const weaponsQuery = createWeaponKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, selectedStyle);
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
      return [...prev, ...searchResults]
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

  const handleSearchTagsChange = useCallback((tags: string[]) => 
  {
    setSearchTags(tags);
    clearResults();
  }, [clearResults]);

  const handleStyleChange = useCallback((style: Style | "All") => 
  {
    setSelectedStyle(style);
    clearResults();
  }, [clearResults]);

  return (
    <>
      <CompendiumListHeader
        searchInput={searchInput}
        handleSearchInputChange={handleSearchInputChange}
        searchTags={searchTags}
        handleSearchTagsChange={handleSearchTagsChange}
        availableTags={availableTags}
        tagsLoading={tagsLoading}
      >
        <StyleFilter selectedStyle={selectedStyle} onStyleChange={handleStyleChange} styles={allowedStyles} />
        <AddWeaponForm />
      </CompendiumListHeader>

      <WithScroll<Weapon>
        parentClassName="flex flex-col gap-2"
        items={displayedWeapons}
        triggerNext={() => 
        {
          if (displayedWeapons.length > 0) setCursor(displayedWeapons[displayedWeapons.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={weapon => <WeaponView key={weapon.id} weapon={weapon} />}
      />
    </>
  );
};

function AddWeaponForm()
{
  const initialValues: WeaponDto = CreateDefaultWeapon();

  const form = useForm<WeaponDto>
  ({
    resolver: zodResolver(weaponSchema),
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
        <ItemAddSheet isPending={isPending} formId={formId} title={displayedText.weapons}>
          <WeaponEditableFields pathPrefix="" />
        </ItemAddSheet>
      </form>
    </Form>
  )
}
