"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/powerSpecificationsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { displayedText } from '@/presentation/translations';
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
import ListHeader from "@/common/components/lists/ListHeader";
import { createPowerSpecificationKeysetQuery } from "@/infrastructure/searchQueries/powers/createPowerSpecificationKeysetQuery";
import PowersSpecificationView from "@/application/compendium/powers/PowerSpecificationView";
import PowerSpecificationEditableFields from "@/application/common/combat/PowerSpecificationEditableFields";
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

  const [displayedPowerSpecifications, setDisplayedPowerSpecifications] = useState<PowerSpecification[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchPowerSpecificationsKey(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const powerSpecificationsQuery = createPowerSpecificationKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize, excludedTags);
      return await searchClient.search<PowerSpecification[]>(powerSpecificationsQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedPowerSpecifications(searchResults);
      return;
    }

    setDisplayedPowerSpecifications(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return [...prev, ...searchResults]
    });
  }, [cursor, searchResults]);

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
        renderItem={powerSpecification => <PowersSpecificationView key={powerSpecification.id} powerSpecification={powerSpecification} />}
      />
    </>
  );
};

function AddPowerSpecificationForm()
{
  const initialValues: AddPowerSpecificationDto = CreateDefaultPowerSpecification();

  const form = useForm<AddPowerSpecificationDto>
  ({
    resolver: zodResolver(addPowerSpecificationSchema),
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
