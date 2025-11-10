"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/stancesClient";
import searchClient from "@/infrastructure/clients/searchClient";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { AddModeDto, addModeSchema, ModeDto } from "@/persistence/schemas/characters/combat/modeSchema";

import { useInitialKeysetSearch } from "@/application/common/hooks/useInitialKeysetSearch";
import { createKeysetSearchStancesKey } from "@/persistence/cacheKeys";
import { createStanceKeysetQuery } from "@/infrastructure/searchQueries/stances/createStanceKeysetQuery";
import StanceView from "@/application/compendium/stances/StanceView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultStance, Mode } from "@/domain/characters/combat/Mode";
import { Input } from "@/common/components/ui/input";
import { useEffect, useState } from "react";
import { useSearchParamChangeWithDebounce } from "@/common/hooks/useQueryParamChange";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";

export default function StancesList()
{
  const { data: stances, initialCursor } = useInitialKeysetSearch<Mode>
  ({
    createQueryKey: createKeysetSearchStancesKey,
    createQuery: createStanceKeysetQuery
  });
  const [displayedStances, setDisplayedStances] = useState<Mode[]>([]);

  useEffect(() =>   
  {
    setDisplayedStances(stances);
    setCursor(initialCursor);
  }, [stances, initialCursor]);

  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const debouncedSearch = useSearchParamChangeWithDebounce();

  const queryKey = createKeysetSearchStancesKey(searchTerm, cursor);
  const query = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      if (!cursor) return [];
      const stancesQuery = createStanceKeysetQuery(searchTerm, cursor);
      return await searchClient.search<Mode[]>(stancesQuery);
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

        <AddStanceForm />
      </div>

      <WithScroll<Mode>
        parentClassName="flex flex-col gap-2"
        items={displayedStances}
        triggerNext={async () => 
        {
          const { data: newData } = await query.refetch();

          if (newData)
          {
            setDisplayedStances(prev => 
            {
              if (newData.length === 0) return prev;
              return [...prev, ...newData];
            });
            setCursor(newData.length === 0 ? undefined : newData[newData.length - 1].id);
          }
        }}
        currentCursor={cursor}
        renderItem={stance => <StanceView key={stance.id} stance={stance} />}
      />
    </>
  );
};

function AddStanceForm()
{
  const initialValues: AddModeDto = CreateDefaultStance();

  const form = useForm<AddModeDto>
  ({
    resolver: zodResolver(addModeSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (stance: AddModeDto) => { await client.add({ ...stance, id: ulid() }) },
    {
      invalidateOnSuccess: ['stances'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-stance-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <AddStanceSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function AddStanceSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.addStance}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<ModeDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<ModeDto> path='grade' inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<ModeDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<ModeDto> path='tags' />
          <FormStringsInput<ModeDto> path='requirements' placeholder={displayedText.addRequirement} />

          <div className="grid grid-cols-2 gap-4">
    
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.price}</Label>
              <InputFormField<ModeDto> path='price' inputClassName='w-11 h-10 text-center font-medium'  />
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
