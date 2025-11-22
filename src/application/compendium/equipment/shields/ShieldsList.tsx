"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/shieldsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/presentation/translations';
import { ShieldDto, shieldSchema } from "@/persistence/schemas/characters/equipment/shieldSchema";
import { createKeysetSearchShieldsKey } from "@/persistence/cacheKeys";
import { createShieldKeysetQuery } from "@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery";
import ShieldView from "@/application/compendium/equipment/shields/ShieldView";
import { ulid } from "ulid";
import { CreateDefaultShield, Shield } from "@/domain/characters/equipment/Shield";
import { useState, useEffect } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import CompendiumListHeader from "@/application/compendium/CompendiumListHeader";
import ItemAddSheet from "@/application/common/equipment/ItemAddSheet";
import ShieldEditableFields from "@/application/common/equipment/EditSheets/ShieldEditableFields";

const pageSize = DEFAULT_PAGE_SIZE;

const EMPTY_ARRAY: never[] = [];

export default function ShieldsList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('shields');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);

  const [displayedShields, setDisplayedShields] = useState<Shield[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchShieldsKey(debouncedSearchTerm, cursor, searchTags, pageSize);
  const { data: searchResults = [] } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const shieldsQuery = createShieldKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize);
      return await searchClient.search<Shield[]>(shieldsQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    setHasMore(searchResults.length === pageSize);

    if (!debouncedSearchTerm && searchTags.length === 0 && cursor === emptyUlid)
    {
      setDisplayedShields(searchResults);
      return;
    }

    setDisplayedShields(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return [...prev, ...searchResults]
    });
  }, [cursor, debouncedSearchTerm, searchTags, searchResults]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    clearResults();
    setSearchInput(e.target.value);
  };

  const handleSearchTagsChange = (tags: string[]) => 
  {
    setSearchTags(tags);
    clearResults();
  };

  const clearResults = () =>
  {
    setDisplayedShields([]);
    setCursor(emptyUlid);
  };

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
        <AddShieldForm />
      </CompendiumListHeader>

      <WithScroll<Shield>
        parentClassName="flex flex-col gap-2"
        items={displayedShields}
        triggerNext={() => 
        {
          if (displayedShields.length > 0) setCursor(displayedShields[displayedShields.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={shield => <ShieldView key={shield.id} shield={shield} />}
      />
    </>
  );
};

function AddShieldForm()
{
  const initialValues: ShieldDto = CreateDefaultShield();

  const form = useForm<ShieldDto>
  ({
    resolver: zodResolver(shieldSchema),
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
        <ItemAddSheet isPending={isPending} formId={formId} title={displayedText.shields} >
          <ShieldEditableFields />
        </ItemAddSheet>
      </form>
    </Form>
  )
}
