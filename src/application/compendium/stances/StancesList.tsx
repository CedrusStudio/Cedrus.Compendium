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

import { createKeysetSearchStancesKey } from "@/persistence/cacheKeys";
import { createStanceKeysetQuery } from "@/infrastructure/searchQueries/stances/createStanceKeysetQuery";
import StanceView from "@/application/compendium/stances/StanceView";
import { Button } from "@/common/components/ui/button";
import { addIcon } from "@/presentation/icons";
import { ulid } from "ulid";
import { CreateDefaultStance, Mode } from "@/domain/characters/combat/Mode";
import { Input } from "@/common/components/ui/input";
import { useEffect, useState } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";
import { useDebounce } from "use-debounce";
import { DEFAULT_PAGE_SIZE, emptyUlid } from "@/common/global/pagination";
import TagFilter from "@/common/components/filters/TagFilter";

const pageSize = DEFAULT_PAGE_SIZE;

export default function StancesList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [searchTags, setSearchTags] = useState<string[]>([]);

  const [displayedStances, setDisplayedStances] = useState<Mode[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string>(emptyUlid);
  
  const queryKey = createKeysetSearchStancesKey(debouncedSearchTerm, cursor, searchTags, pageSize);
  const { data: searchResults = [] } = useQuery
  ({ 
    queryKey, 
    queryFn: async () => 
    {
      const stancesQuery = createStanceKeysetQuery(debouncedSearchTerm, cursor, pageSize, searchTags);
      return await searchClient.search<Mode[]>(stancesQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    setHasMore(searchResults.length === pageSize);

    if (!debouncedSearchTerm && searchTags.length === 0 && cursor === emptyUlid)
    {
      setDisplayedStances(searchResults);
      return;
    }

    setDisplayedStances(prev =>  
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
    setDisplayedStances([]);
    setCursor(emptyUlid);
  };

  return (
    <>
      <div className="flex flex-row gap-8 m-3 px-10 items-center">
        <Input 
          name="search" 
          type="text" 
          placeholder={displayedText.searchByName}
          value={searchInput}
          onChange={handleSearchInputChange}
          className="max-w-max"
        />

        <TagFilter includedTags={searchTags} onTagsChange={handleSearchTagsChange} />

        <AddStanceForm />
      </div>

      <WithScroll<Mode>
        parentClassName="flex flex-col gap-2"
        items={displayedStances}
        triggerNext={() => 
        {
          if (displayedStances.length > 0) setCursor(displayedStances[displayedStances.length - 1].id);
        }}
        hasMore={hasMore}
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
