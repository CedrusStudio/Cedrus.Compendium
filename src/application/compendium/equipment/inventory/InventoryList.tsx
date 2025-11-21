"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/inventoryClient";
import searchClient from "@/infrastructure/clients/searchClient";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { InventoryItemDto, itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";

import { createKeysetSearchInventoryKey } from "@/persistence/cacheKeys";
import { createInventoryItemKeysetQuery } from "@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery";
import InventoryItemView from "@/application/compendium/equipment/inventory/InventoryItemView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultInventoryItem, Item } from "@/domain/characters/equipment/Item";
import { Input } from "@/common/components/ui/input";
import { useState, useEffect } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import TagFilter from "@/common/components/filters/TagFilter";
import { useEntityTags } from '@/common/hooks/useEntityTags';

const pageSize = DEFAULT_PAGE_SIZE;

const EMPTY_ARRAY: never[] = [];

export default function InventoryList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('inventory');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);

  const [displayedInventory, setDisplayedInventory] = useState<Item[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchInventoryKey(debouncedSearchTerm, cursor, searchTags, pageSize);
  const { data: searchResults = [] } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const inventoryQuery = createInventoryItemKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize);
      return await searchClient.search<Item[]>(inventoryQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    setHasMore(searchResults.length === pageSize);

    if (!debouncedSearchTerm && searchTags.length === 0 && cursor === emptyUlid)
    {
      setDisplayedInventory(searchResults);
      return;
    }

    setDisplayedInventory(prev =>  
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
    setDisplayedInventory([]);
    setCursor(emptyUlid);
  };

  return (
    <>
      <div className="flex flex-row gap-8 m-3 px-10 items-center sticky top-0 bg-background z-10">
        <Input 
          name="search" 
          type="text" 
          placeholder={displayedText.searchByName}
          value={searchInput}
          onChange={handleSearchInputChange}
          className="max-w-max"
        />

        <TagFilter includedTags={searchTags} onTagsChange={handleSearchTagsChange} availableTags={availableTags} isLoading={tagsLoading} />

        <AddInventoryItemForm />
      </div>

      <WithScroll<Item>
        parentClassName="flex flex-col gap-2"
        items={displayedInventory}
        triggerNext={() => 
        {
          if (displayedInventory.length > 0) setCursor(displayedInventory[displayedInventory.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={item => <InventoryItemView key={item.id} item={item} />}
      />
    </>
  );
};

function AddInventoryItemForm()
{
  const initialValues: InventoryItemDto = CreateDefaultInventoryItem();

  const form = useForm<InventoryItemDto>
  ({
    resolver: zodResolver(itemSchema),
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
        <AddInventoryItemSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function AddInventoryItemSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.add} {displayedText.inventory}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<InventoryItemDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<InventoryItemDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<InventoryItemDto> path='tags' />

        </div>

        <SheetFooter>
          <SubmitButton isPending={isPending} className="w-full" formName={formId} />
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
