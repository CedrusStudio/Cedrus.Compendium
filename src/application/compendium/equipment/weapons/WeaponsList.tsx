"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/weaponsClient";
import searchClient from "@/infrastructure/clients/searchClient";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/presentation/translations';
import { WeaponDto, weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";

import { createKeysetSearchWeaponsKey } from "@/persistence/cacheKeys";
import { createWeaponKeysetQuery } from "@/infrastructure/searchQueries/equipment/weapons/createWeaponKeysetQuery";
import WeaponView from "@/application/compendium/equipment/weapons/WeaponView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultWeapon, Weapon, allowedStyles, Style } from "@/domain/characters/equipment/Weapon";
import { Input } from "@/common/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { allowedDiceGrades } from "@/domain/characters/combat/Offense";
import TagFilter from "@/common/components/filters/TagFilter";
import StyleFilter from "@/common/components/filters/StyleFilter";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';

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
  
  const queryKey = createKeysetSearchWeaponsKey(debouncedSearchTerm, cursor, searchTags, selectedStyle, pageSize);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const weaponsQuery = createWeaponKeysetQuery(debouncedSearchTerm, cursor, pageSize, searchTags, selectedStyle);
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
      <div className="flex flex-row gap-2 m-3 px-10 items-center">
        <Input 
          name="search" 
          type="text" 
          placeholder={displayedText.searchByName}
          value={searchInput}
          onChange={handleSearchInputChange}
          className="max-w-max"
        />

        <TagFilter includedTags={searchTags} onTagsChange={handleSearchTagsChange} availableTags={availableTags} isLoading={tagsLoading} />
        <StyleFilter selectedStyle={selectedStyle} onStyleChange={handleStyleChange} styles={allowedStyles} />

        <AddWeaponForm />
      </div>

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
        <AddWeaponSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function AddWeaponSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.add} {displayedText.weapons}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<WeaponDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<WeaponDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<WeaponDto> path='tags' />

          <div className="flex flex-col items-center gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.style}</span></Label>
            <SelectFormField<WeaponDto> path='style' labelText={displayedText.style} items={allowedStyles} />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='justify-center capitalize'>{displayedText.range}</Label>
            <InputFormField<WeaponDto> path='range' inputClassName='w-11 h-10 text-center font-medium' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='font-semibold text-base'>{displayedText.offense}</Label>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.amount}</Label>
                <InputFormField<WeaponDto> path='offense.amount' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.grade}</Label>
                <SelectFormField<WeaponDto> path='offense.grade' labelText={displayedText.grade} items={allowedDiceGrades} />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.bonus}</Label>
                <InputFormField<WeaponDto> path='offense.bonus' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.critical} {displayedText.power}</Label>
                <InputFormField<WeaponDto> path='offense.critical.power' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.critical} {displayedText.range}</Label>
                <InputFormField<WeaponDto> path='offense.critical.range' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
            </div>
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='font-semibold text-base'>{displayedText.damageBonus}</Label>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.amount}</Label>
                <InputFormField<WeaponDto> path='damageBonus.amount' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.grade}</Label>
                <SelectFormField<WeaponDto> path='damageBonus.grade' labelText={displayedText.grade} items={allowedDiceGrades} />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.bonus}</Label>
                <InputFormField<WeaponDto> path='damageBonus.bonus' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
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
