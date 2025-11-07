"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/maneuversClient";
import searchClient from "@/infrastructure/clients/searchClient";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/presentation/translations';
import { AddManeuverDto, addManeuverSchema, ManeuverDto } from "@/persistence/schemas/characters/combat/maneuverSchema";

import { useInitialKeysetSearchManeuvers } from "@/application/compendium/maneuvers/hooks/useInitialKeysetSearchManeuvers";
import ManeuverView from "@/application/compendium/maneuvers/ManeuverView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultManeuver, Maneuver } from "@/domain/characters/combat/Maneuver";
import { Input } from "@/common/components/ui/input";
import { useEffect, useState } from "react";
import { useSearchParamChangeWithDebounce } from "@/common/hooks/useQueryParamChange";
import { WithScroll } from "@/common/components/WithScroll";
import { createManeuverKeysetQuery } from "@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery";
import { useQuery } from "@tanstack/react-query";
import { createKeysetSearchManeuversKey } from "@/persistence/cacheKeys";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";

export default function ManeuversList()
{
  const { maneuvers, initialCursor } = useInitialKeysetSearchManeuvers();
  const [displayedManeuvers, setDisplayedManeuvers] = useState<Maneuver[]>([]);

  useEffect(() =>   
  {
    setDisplayedManeuvers(maneuvers);
    setCursor(initialCursor);
  }, [maneuvers, initialCursor]);

  const [searchTerm, setSearchTerm] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const debouncedSearch = useSearchParamChangeWithDebounce();

  const queryKey = createKeysetSearchManeuversKey(searchTerm, cursor);
  const query = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      if (!cursor) return [];
      const maneuversQuery = createManeuverKeysetQuery(searchTerm, cursor);
      return await searchClient.search<Maneuver[]>(maneuversQuery);
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

        <AddManeuverForm />
      </div>

      <WithScroll<Maneuver>
        parentClassName="flex flex-col gap-2"
        items={displayedManeuvers}
        triggerNext={async () => 
        {
          const { data: newData } = await query.refetch();

          if (newData)
          {
            setDisplayedManeuvers(prev => 
            {
              if (newData.length === 0) return prev;
              return [...prev, ...newData];
            });
            setCursor(newData.length === 0 ? undefined : newData[newData.length - 1].id);
          }
        }}
        currentCursor={cursor}
        renderItem={maneuver => <ManeuverView key={maneuver.id} maneuver={maneuver} />}
      />
    </>
  );
};

function AddManeuverForm()
{
  const initialValues: AddManeuverDto = CreateDefaultManeuver();

  const form = useForm<AddManeuverDto>
  ({
    resolver: zodResolver(addManeuverSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (maneuver: AddManeuverDto) => { await client.add({ ...maneuver, id: ulid() }) },
    {
      invalidateOnSuccess: ['maneuvers'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-maneuver-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <AddManeuverSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function AddManeuverSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.addManeuver}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<ManeuverDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<ManeuverDto> path='grade' inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<ManeuverDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<ManeuverDto> path='tags' />
          <FormStringsInput<ManeuverDto> path='requirements' placeholder={displayedText.addRequirement} />

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
              <InputFormField<ManeuverDto> path='cooldown' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.price}</Label>
              <InputFormField<ManeuverDto> path='price' inputClassName='w-11 h-10 text-center font-medium'  />
            </div>
          </div>
  
          <div className="flex flex-col items-center gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
            <SelectFormField<ManeuverDto> path='castTime' labelText={displayedText.castTime} items={allowedCastTimes} />
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
