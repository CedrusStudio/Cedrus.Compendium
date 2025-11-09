"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/shieldsClient";
import searchClient from "@/infrastructure/clients/searchClient";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { ShieldDto, shieldSchema } from "@/persistence/schemas/characters/equipment/shieldSchema";

import { useInitialKeysetSearchShields } from "@/application/compendium/equipment/shields/hooks/useInitialKeysetSearchShields";
import ShieldView from "@/application/compendium/equipment/shields/ShieldView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultShield, Shield } from "@/domain/characters/equipment/Shield";
import { Input } from "@/common/components/ui/input";
import { useEffect, useState } from "react";
import { useSearchParamChangeWithDebounce } from "@/common/hooks/useQueryParamChange";
import { WithScroll } from "@/common/components/WithScroll";
import { createShieldKeysetQuery } from "@/infrastructure/searchQueries/equipment/shields/createShieldKeysetQuery";
import { useQuery } from "@tanstack/react-query";
import { createKeysetSearchShieldsKey } from "@/persistence/cacheKeys";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";

export default function ShieldsList()
{
  const { shields, initialCursor } = useInitialKeysetSearchShields();
  const [displayedShields, setDisplayedShields] = useState<Shield[]>([]);

  useEffect(() =>   
  {
    setDisplayedShields(shields);
    setCursor(initialCursor);
  }, [shields, initialCursor]);

  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const debouncedSearch = useSearchParamChangeWithDebounce();

  const queryKey = createKeysetSearchShieldsKey(searchTerm, cursor);
  const query = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      if (!cursor) return [];
      const shieldsQuery = createShieldKeysetQuery(searchTerm, cursor);
      return await searchClient.search<Shield[]>(shieldsQuery);
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

        <AddShieldForm />
      </div>

      <WithScroll<Shield>
        parentClassName="flex flex-col gap-2"
        items={displayedShields}
        triggerNext={async () => 
        {
          const { data: newData } = await query.refetch();

          if (newData)
          {
            setDisplayedShields(prev => 
            {
              if (newData.length === 0) return prev;
              return [...prev, ...newData];
            });
            setCursor(newData.length === 0 ? undefined : newData[newData.length - 1].id);
          }
        }}
        currentCursor={cursor}
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
        <AddShieldSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function AddShieldSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.add} {displayedText.shields}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<ShieldDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<ShieldDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<ShieldDto> path='tags' />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.block}</Label>
              <InputFormField<ShieldDto> path='block' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.resistance}</Label>
              <InputFormField<ShieldDto> path='resistance' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.dexterityRestriction}</Label>
              <InputFormField<ShieldDto> path='dexterityRestriction' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.initiativeRestriction}</Label>
              <InputFormField<ShieldDto> path='initiativeRestriction' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.attributePenalty}</Label>
              <InputFormField<ShieldDto> path='attributePenalty' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.strengthRequirement}</Label>
              <InputFormField<ShieldDto> path='strengthRequirement' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

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
