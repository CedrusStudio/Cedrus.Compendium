"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/maneuversClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { allowedCastTimes, type CastTime } from "@/domain/characters/Castable";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/common/translations';
import { AddManeuverWithEffectsDto, addManeuverWithEffectsSchema, ManeuverDto } from "@/persistence/schemas/characters/combat/maneuverSchema";
import { ManeuverEffectsEditableFields } from "@/application/combat-lab/effects-editor/ManeuverEffectsEditableFields";
import { createOffsetSearchManeuversKey } from "@/persistence/cacheKeys";
import { createManeuverOffsetQuery } from "@/infrastructure/searchQueries/maneuvers/createManeuverOffsetQuery";
import ManeuverView from "@/application/compendium/maneuvers/ManeuverView";
import { ulid } from "ulid";
import { CreateDefaultManeuver, Maneuver } from "@/domain/characters/combat/Maneuver";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { normalizeGradeFilterInput, parseGradeFilterInput } from "@/common/global/gradeFilter";
import { DEFAULT_PAGE_SIZE } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import ListHeader from "@/common/components/lists/ListHeader";
import PerkableAddSheet from "@/application/common/PerkableAddSheet";
import RequirementFilter from "@/application/common/requirements/RequirementFilter";
import type { RequirementSearchFilter } from "@/common/global/SearchPayloads";
import GroupedItemsList from "@/common/components/lists/GroupedItemsList";
import { Button } from "@/ui/button";
import { List, Layers, Wand2 } from "lucide-react";
import CastTimeFilter from "@/common/components/filters/CastTimeFilter";

const pageSize = DEFAULT_PAGE_SIZE;
const EMPTY_ARRAY: never[] = [];

/** A maneuver still awaiting effect authoring (no effects and not marked unsupported). */
function needsEffects(m: Maneuver): boolean
{
  const hasEffects = Array.isArray(m.effects) && m.effects.length > 0;
  return m.simulatable !== false && !hasEffects;
}

export default function ManeuversList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [gradeFilter, setGradeFilter] = useState("");
  const [debouncedGradeFilter] = useDebounce(gradeFilter, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('maneuvers');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [selectedCastTimes, setSelectedCastTimes] = useState<CastTime[]>(EMPTY_ARRAY);
  const [isGroupedView, setIsGroupedView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('maneuvers-grouped-view') === 'true';
    }
    return false;
  });

  const [displayedManeuvers, setDisplayedManeuvers] = useState<Maneuver[]>(EMPTY_ARRAY);
  const [onlyNeedsEffects, setOnlyNeedsEffects] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [requirementFilters, setRequirementFilters] = useState<RequirementSearchFilter[]>(EMPTY_ARRAY);
  const selectedGrade = parseGradeFilterInput(debouncedGradeFilter);

  const queryKey = [createOffsetSearchManeuversKey(debouncedSearchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedCastTimes, selectedGrade), requirementFilters];
  const { data: searchResults } = useQuery
  ({
    queryKey,
    queryFn: async () =>
    {
      const maneuversQuery = createManeuverOffsetQuery(debouncedSearchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedCastTimes, selectedGrade);
      if (requirementFilters.length > 0) maneuversQuery.requirementFilters = requirementFilters;
      return await searchClient.search<Maneuver[]>(maneuversQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;
    
    setHasMore(searchResults.length === pageSize);

    if (pageNumber === 1)
    {
      setDisplayedManeuvers(searchResults);
      return;
    }

    setDisplayedManeuvers(prev => [...prev, ...searchResults]);
  }, [pageNumber, searchResults]);

  const clearResults = useCallback(() =>
  {
    setDisplayedManeuvers(EMPTY_ARRAY);
    setPageNumber(1);
  }, []);

  const handleSearchInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => 
  {
    clearResults();
    setSearchInput(e.target.value);
  }, [clearResults]);

  const handleGradeFilterChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) =>
  {
    clearResults();
    setGradeFilter(normalizeGradeFilterInput(e.target.value));
  }, [clearResults]);

  const handleSearchTagsChange = useCallback((tags: string[]) => 
  {
    setSearchTags(tags);
    clearResults();
  }, [clearResults]);

  const handleExcludedTagsChange = useCallback((tags: string[]) =>
  {
    setExcludedTags(tags);
    clearResults();
  }, [clearResults]);

  const handleRequirementFiltersChange = useCallback((filters: RequirementSearchFilter[]) =>
  {
    setRequirementFilters(filters);
    clearResults();
  }, [clearResults]);

  const handleSelectedCastTimesChange = useCallback((castTimes: CastTime[]) =>
  {
    setSelectedCastTimes(castTimes);
    clearResults();
  }, [clearResults]);

  const handleDelete = useCallback((id: string) =>
  {
    setDisplayedManeuvers(prev => prev.filter(maneuver => maneuver.id !== id));
  }, []);

  const toggleViewMode = useCallback(() => {
    setIsGroupedView(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('maneuvers-grouped-view', String(newValue));
      }
      return newValue;
    });
  }, []);

  const handleScopeToGroup = useCallback((groupName: string) => {
    setSearchInput(groupName);
    clearResults();
  }, [clearResults]);

  // Client-side view filter over the already-loaded page(s). For the full-roster
  // picture use `scripts/maneuver-coverage.ts`.
  const visibleManeuvers = onlyNeedsEffects ? displayedManeuvers.filter(needsEffects) : displayedManeuvers;

  return (
    <>
      <ListHeader
        searchInput={searchInput}
        handleSearchInputChange={handleSearchInputChange}
        gradeFilter={gradeFilter}
        handleGradeFilterChange={handleGradeFilterChange}
        searchTags={searchTags}
        handleSearchTagsChange={handleSearchTagsChange}
        excludedTags={excludedTags}
        handleExcludedTagsChange={handleExcludedTagsChange}
        availableTags={availableTags}
        tagsLoading={tagsLoading}
        personalizationContext="maneuvers"
        extraFilters={<RequirementFilter value={requirementFilters} onChange={handleRequirementFiltersChange} />}
      >
        <CastTimeFilter selectedCastTimes={selectedCastTimes} onSelectedCastTimesChange={handleSelectedCastTimesChange} />
        <Button
          variant={onlyNeedsEffects ? "default" : "outline"}
          size="icon"
          onClick={() => setOnlyNeedsEffects(v => !v)}
          title={onlyNeedsEffects ? "Pokaż wszystkie manewry" : "Tylko wymagające efektów (z załadowanych)"}
        >
          <Wand2 className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleViewMode}
          title={isGroupedView ? "Switch to flat view" : "Switch to grouped view"}
        >
          {isGroupedView ? <List className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
        </Button>
        <AddManeuverForm />
      </ListHeader>

      {isGroupedView ? (
        <GroupedItemsList<Maneuver>
          items={visibleManeuvers}
          renderItem={maneuver => <ManeuverView key={maneuver.id} maneuver={maneuver} onDelete={handleDelete} />}
          triggerNext={() => {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
          onScopeToGroup={handleScopeToGroup}
        />
      ) : (
        <WithScroll<Maneuver>
          parentClassName="flex flex-col gap-2"
          items={visibleManeuvers}
          triggerNext={() => 
          {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
          renderItem={maneuver => <ManeuverView key={maneuver.id} maneuver={maneuver} onDelete={handleDelete} />}
        />
      )}
    </>
  );
};

function AddManeuverForm()
{
  const initialValues: AddManeuverWithEffectsDto = CreateDefaultManeuver();

  const form = useForm<AddManeuverWithEffectsDto>
  ({
    resolver: typedZodResolver(addManeuverWithEffectsSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (maneuver: AddManeuverWithEffectsDto) => { await client.add({ ...maneuver, id: ulid() }) },
    {
      invalidateOnSuccess: ['maneuvers'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `add-maneuver-form`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <PerkableAddSheet isPending={isPending} formId={formId} title={displayedText.addManeuver} entityType="maneuvers">
          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
              <InputFormField<ManeuverDto> path='cooldown' inputClassName='w-11 h-10 text-center font-medium' />
            </div>

            <div className="flex flex-col items-center gap-3 px-4">
              <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
              <SelectFormField<ManeuverDto> path='castTime' labelText={displayedText.castTime} items={allowedCastTimes} />
            </div>

          </div>

          <ManeuverEffectsEditableFields />

        </PerkableAddSheet>
      </form>
    </Form>
  )
}

