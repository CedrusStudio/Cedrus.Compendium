"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/statesClient";
import searchClient from "@/infrastructure/clients/searchClient";

import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { AddModeDto, addModeSchema, ModeDto } from "@/persistence/schemas/characters/combat/modeSchema";

import { createKeysetSearchStatesKey } from "@/persistence/cacheKeys";
import { createStateKeysetQuery } from "@/infrastructure/searchQueries/states/createStateKeysetQuery";
import StateView from "@/application/compendium/states/StateView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultState, Mode } from "@/domain/characters/combat/Mode";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";
import { useQuery } from "@tanstack/react-query";
import { useEntityTags } from "@/common/hooks/useEntityTags";
import CompendiumListHeader from "@/application/compendium/CompendiumListHeader";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

export default function StatesList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('states');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);

  const [displayedStates, setDisplayedStates] = useState<Mode[]>(EMPTY_ARRAY);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchStatesKey(debouncedSearchTerm, cursor, searchTags, pageSize);
  const { data: searchResults } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const statesQuery = createStateKeysetQuery(debouncedSearchTerm, cursor, searchTags, pageSize);
      return await searchClient.search<Mode[]>(statesQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (cursor === emptyUlid)
    {
      setDisplayedStates(searchResults);
      return;
    }

    setDisplayedStates(prev =>  
    {
      if (searchResults.length === 0) return prev;
      return [...prev, ...searchResults]
    });
  }, [cursor, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedStates(EMPTY_ARRAY);
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
        <AddStateForm />
      </CompendiumListHeader>

      <WithScroll<Mode>
        parentClassName="flex flex-col gap-2"
        items={displayedStates}
        triggerNext={() => 
        {
          if (displayedStates.length > 0) setCursor(displayedStates[displayedStates.length - 1].id);
        }}
        hasMore={hasMore}
        renderItem={state => <StateView key={state.id} state={state} />}
      />
    </>
  );
};

function AddStateForm()
{
  const initialValues: AddModeDto = CreateDefaultState();

  const form = useForm<AddModeDto>
  ({
    resolver: zodResolver(addModeSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (state: AddModeDto) => { await client.add({ ...state, id: ulid() }) },
    {
      invalidateOnSuccess: ['states'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-state-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <AddStateSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function AddStateSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{addIcon()}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.addState}</SheetTitle>
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
