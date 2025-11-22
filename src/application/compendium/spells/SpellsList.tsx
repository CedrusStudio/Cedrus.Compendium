"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/spellsClient";
import searchClient from "@/infrastructure/clients/searchClient";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/presentation/translations';
import { AddSpellDto, addSpellSchema, SpellDto } from "@/persistence/schemas/characters/combat/powerSchema";

import { createKeysetSearchSpellsKey } from "@/persistence/cacheKeys";
import { createSpellKeysetQuery } from "@/infrastructure/searchQueries/spells/createSpellKeysetQuery";
import SpellView from "@/application/compendium/spells/SpellView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultSpell, Spell } from "@/domain/characters/combat/Power";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import CompendiumListHeader from "@/application/compendium/CompendiumListHeader";

const pageSize = DEFAULT_PAGE_SIZE;

const EMPTY_ARRAY: never[] = [];

export default function SpellsList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('spells');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);

  const [displayedSpells, setDisplayedSpells] = useState<Spell[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchSpellsKey(debouncedSearchTerm, cursor, searchTags, pageSize);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const spellsQuery = createSpellKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize);
      return await searchClient.search<Spell[]>(spellsQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedSpells(searchResults);
      return;
    }

    setDisplayedSpells(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return [...prev, ...searchResults]
    });
  }, [cursor, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedSpells(EMPTY_ARRAY);
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
        <AddSpellForm />
      </CompendiumListHeader>

      <WithScroll<Spell>
        parentClassName="flex flex-col gap-2"
        items={displayedSpells}
        triggerNext={() => 
        {
          if (displayedSpells.length > 0) setCursor(displayedSpells[displayedSpells.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={spell => <SpellView key={spell.id} spell={spell} />}
      />
    </>
  );
};

function AddSpellForm()
{
  const initialValues: AddSpellDto = CreateDefaultSpell();

  const form = useForm<AddSpellDto>
  ({
    resolver: zodResolver(addSpellSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (spell: AddSpellDto) => { await client.add({ ...spell, id: ulid() }) },
    {
      invalidateOnSuccess: ['spells'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-spell-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <AddSpellSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function AddSpellSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.addSpell}</SheetTitle>
          <SheetDescription>{displayedText.clickSave}</SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<SpellDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<SpellDto> path='grade' inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<SpellDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<SpellDto> path='tags' />
          <FormStringsInput<SpellDto> path='requirements' placeholder={displayedText.addRequirement} />

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
              <InputFormField<SpellDto> path='cooldown' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.price}</Label>
              <InputFormField<SpellDto> path='price' inputClassName='w-11 h-10 text-center font-medium'  />
            </div>
          </div>
  
          <div className="flex flex-col items-center gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
            <SelectFormField<SpellDto> path='castTime' labelText={displayedText.castTime} items={allowedCastTimes} />
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
