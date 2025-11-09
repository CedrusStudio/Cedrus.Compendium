"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/armorsClient";
import searchClient from "@/infrastructure/clients/searchClient";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { ArmorDto, armorSchema } from "@/persistence/schemas/characters/equipment/armorSchema";

import { useInitialKeysetSearchArmors } from "@/application/compendium/equipment/armors/hooks/useInitialKeysetSearchArmors";
import ArmorView from "@/application/compendium/equipment/armors/ArmorView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultArmor, Armor } from "@/domain/characters/equipment/Armor";
import { Input } from "@/common/components/ui/input";
import { useEffect, useState } from "react";
import { useSearchParamChangeWithDebounce } from "@/common/hooks/useQueryParamChange";
import { WithScroll } from "@/common/components/WithScroll";
import { createArmorKeysetQuery } from "@/infrastructure/searchQueries/equipment/armors/createArmorKeysetQuery";
import { useQuery } from "@tanstack/react-query";
import { createKeysetSearchArmorsKey } from "@/persistence/cacheKeys";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";

export default function ArmorsList()
{
  const { armors, initialCursor } = useInitialKeysetSearchArmors();
  const [displayedArmors, setDisplayedArmors] = useState<Armor[]>([]);

  useEffect(() =>   
  {
    setDisplayedArmors(armors);
    setCursor(initialCursor);
  }, [armors, initialCursor]);

  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const debouncedSearch = useSearchParamChangeWithDebounce();

  const queryKey = createKeysetSearchArmorsKey(searchTerm, cursor);
  const query = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      if (!cursor) return [];
      const armorsQuery = createArmorKeysetQuery(searchTerm, cursor);
      return await searchClient.search<Armor[]>(armorsQuery);
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

        <AddArmorForm />
      </div>

      <WithScroll<Armor>
        parentClassName="flex flex-col gap-2"
        items={displayedArmors}
        triggerNext={async () => 
        {
          const { data: newData } = await query.refetch();

          if (newData)
          {
            setDisplayedArmors(prev => 
            {
              if (newData.length === 0) return prev;
              return [...prev, ...newData];
            });
            setCursor(newData.length === 0 ? undefined : newData[newData.length - 1].id);
          }
        }}
        currentCursor={cursor}
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
        <AddArmorSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function AddArmorSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.add} {displayedText.armor}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<ArmorDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<ArmorDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<ArmorDto> path='tags' />

          <div className="grid grid-cols-3 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.protection}</Label>
              <InputFormField<ArmorDto> path='protection' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.immunity}</Label>
              <InputFormField<ArmorDto> path='immunity' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.resistance}</Label>
              <InputFormField<ArmorDto> path='resistance' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.dexterityRestriction}</Label>
              <InputFormField<ArmorDto> path='dexterityRestriction' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.initiativeRestriction}</Label>
              <InputFormField<ArmorDto> path='initiativeRestriction' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.attributePenalty}</Label>
              <InputFormField<ArmorDto> path='attributePenalty' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.strengthRequirement}</Label>
              <InputFormField<ArmorDto> path='strengthRequirement' inputClassName='w-11 h-10 text-center font-medium' />
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
