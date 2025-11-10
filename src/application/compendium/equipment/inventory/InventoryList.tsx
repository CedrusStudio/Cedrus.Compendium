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

import { useInitialKeysetSearch } from "@/application/common/hooks/useInitialKeysetSearch";
import { createKeysetSearchInventoryKey } from "@/persistence/cacheKeys";
import { createInventoryItemKeysetQuery } from "@/infrastructure/searchQueries/equipment/inventory/createInventoryItemKeysetQuery";
import InventoryItemView from "@/application/compendium/equipment/inventory/InventoryItemView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultInventoryItem, Item } from "@/domain/characters/equipment/Item";
import { Input } from "@/common/components/ui/input";
import { useEffect, useState } from "react";
import { useSearchParamChangeWithDebounce } from "@/common/hooks/useQueryParamChange";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";

export default function InventoryList()
{
  const { data: inventory, initialCursor } = useInitialKeysetSearch<Item>
  ({
    createQueryKey: createKeysetSearchInventoryKey,
    createQuery: createInventoryItemKeysetQuery
  });
  const [displayedInventory, setDisplayedInventory] = useState<Item[]>([]);

  useEffect(() =>   
  {
    setDisplayedInventory(inventory);
    setCursor(initialCursor);
  }, [inventory, initialCursor]);

  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const debouncedSearch = useSearchParamChangeWithDebounce();

  const queryKey = createKeysetSearchInventoryKey(searchTerm, cursor);
  const query = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      if (!cursor) return [];
      const inventoryQuery = createInventoryItemKeysetQuery(searchTerm, cursor);
      return await searchClient.search<Item[]>(inventoryQuery);
    }
  });

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  return (
    <>
      <div className="flex flex-row gap-8 m-3 px-10 items-center">
        <Input 
          name="search" 
          type="text" 
          placeholder={displayedText.searchByName}
          value={searchTerm}
          onChange={handleSearchInputChange}
          className="max-w-max"
        />

        <AddInventoryItemForm />
      </div>

      <WithScroll<Item>
        parentClassName="flex flex-col gap-2"
        items={displayedInventory}
        triggerNext={async () => 
        {
          const { data: newData } = await query.refetch();

          if (newData)
          {
            setDisplayedInventory(prev => 
            {
              if (newData.length === 0) return prev;
              return [...prev, ...newData];
            });
            setCursor(newData.length === 0 ? undefined : newData[newData.length - 1].id);
          }
        }}
        currentCursor={cursor}
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
