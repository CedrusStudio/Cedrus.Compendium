"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/armorsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/common/translations';
import { ArmorDto, armorSchema } from "@/persistence/schemas/characters/equipment/armorSchema";
import { createKeysetSearchArmorsKey } from "@/persistence/cacheKeys";
import { createArmorKeysetQuery } from "@/infrastructure/searchQueries/equipment/armors/createArmorKeysetQuery";
import ArmorView from "@/application/compendium/equipment/armors/ArmorView";
import { ulid } from "ulid";
import { CreateDefaultArmor, Armor } from "@/domain/characters/equipment/Armor";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import ListHeader from "@/common/components/lists/ListHeader";
import ArmorEditableFields from "@/application/common/equipment/EditSheets/ArmorEditableFields";
import ItemAddSheet from "@/application/common/equipment/ItemAddSheet";

const pageSize = DEFAULT_PAGE_SIZE;

const EMPTY_ARRAY: never[] = [];

export default function ArmorsList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('armors');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);

  const [displayedArmors, setDisplayedArmors] = useState<Armor[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchArmorsKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const armorsQuery = createArmorKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      return await searchClient.search<Armor[]>(armorsQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedArmors(searchResults);
      return;
    }

    setDisplayedArmors(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return Array.from(new Map([...prev, ...searchResults].map(armor => [armor.id, armor])).values());
    });
  }, [cursor, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedArmors(EMPTY_ARRAY);
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
        <AddArmorForm />
      </ListHeader>

      <WithScroll<Armor>
        parentClassName="flex flex-col gap-2"
        items={displayedArmors}
        triggerNext={() => 
        {
          if (displayedArmors.length > 0) setCursor(displayedArmors[displayedArmors.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={armor => <ArmorView key={armor.id} armor={armor} />}
      />
    </>
  );
};

function AddArmorForm()
{
  const initialValues: ArmorDto = CreateDefaultArmor();

  const form = useForm<ArmorDto>
  ({
    resolver: zodResolver(armorSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (armor: ArmorDto) => { await client.add({ ...armor, id: ulid() }) },
    {
      invalidateOnSuccess: ['armors'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-armor-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <ItemAddSheet isPending={isPending} formId={formId} title={displayedText.armor} >
          <ArmorEditableFields />
        </ItemAddSheet>
      </form>
    </Form>
  )
}
