"use client";

import { Form } from "@/ui/form";
import { typedZodResolver } from "@/common/global/validation";
import { useForm } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/spellsClient";
import searchClient from "@/infrastructure/clients/searchClient";
import { type CastTime } from "@/domain/characters/Castable";
import { displayedText } from '@/common/translations';
import { AddSpellDto, addSpellSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import { createOffsetSearchSpellsKey } from "@/persistence/cacheKeys";
import { createSpellOffsetQuery } from "@/infrastructure/searchQueries/spells/createSpellOffsetQuery";
import SpellView from "@/application/compendium/spells/SpellView";
import { ulid } from "ulid";
import { CreateDefaultSpell, Spell } from "@/domain/characters/combat/Power";
import { useState, useEffect, useCallback } from "react";
import { WithScroll } from "@/common/components/WithScroll";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { normalizeGradeFilterInput, parseGradeFilterInput } from "@/common/global/gradeFilter";
import { DEFAULT_PAGE_SIZE } from "@/common/global/pagination";
import { useEntityTags } from '@/common/hooks/useEntityTags';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import ListHeader from "@/common/components/lists/ListHeader";
import PerkableAddSheet from "@/application/common/PerkableAddSheet";
import RequirementFilter from "@/application/common/requirements/RequirementFilter";
import type { RequirementSearchFilter } from "@/common/global/SearchPayloads";
import GroupedItemsList from "@/common/components/lists/GroupedItemsList";
import { Button } from "@/ui/button";
import { List, Layers } from "lucide-react";
import CastTimeFilter from "@/common/components/filters/CastTimeFilter";
import { CharacterModeFilter } from "@/application/compendium/CharacterModeFilter";
import { matchesOwned, narrowToOwned, ownedFilterKey, type OwnedFilter } from "@/application/compendium/characterOwnership";
import SpellEditableFields from '@/application/common/combat/SpellEditableFields';

const pageSize = DEFAULT_PAGE_SIZE;

const EMPTY_ARRAY: never[] = [];

export default function SpellsList()
{
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchInput, 300);
  const [gradeFilter, setGradeFilter] = useState("");
  const [debouncedGradeFilter] = useDebounce(gradeFilter, 300);
  const { tags: availableTags, isLoading: tagsLoading } = useEntityTags('spells');
  const [searchTags, setSearchTags] = useState<string[]>(EMPTY_ARRAY);
  const [excludedTags, setExcludedTags] = useState<string[]>(EMPTY_ARRAY);
  const [facetFilters, setFacetFilters] = useState<TagFacetFilter[]>(EMPTY_ARRAY);
  const [selectedCastTimes, setSelectedCastTimes] = useState<CastTime[]>(EMPTY_ARRAY);
  const [isGroupedView, setIsGroupedView] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('spells-grouped-view') === 'true';
    }
    return false;
  });

  const [displayedSpells, setDisplayedSpells] = useState<Spell[]>(EMPTY_ARRAY);

  const [ownedFilter, setOwnedFilter] = useState<OwnedFilter | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [requirementFilters, setRequirementFilters] = useState<RequirementSearchFilter[]>(EMPTY_ARRAY);
  const selectedGrade = parseGradeFilterInput(debouncedGradeFilter);

  const ownedKey = ownedFilterKey(ownedFilter);
  const queryKey = [...[createOffsetSearchSpellsKey(debouncedSearchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedCastTimes, selectedGrade), requirementFilters, facetFilters], ownedKey];
  const { data: searchResults } = useQuery
  ({
    queryKey,
    queryFn: async () =>
    {
      const spellsQuery = createSpellOffsetQuery(debouncedSearchTerm, pageNumber, searchTags, pageSize, excludedTags, selectedCastTimes, selectedGrade);
      narrowToOwned(spellsQuery, ownedFilter, debouncedSearchTerm);
      if (requirementFilters.length > 0) spellsQuery.requirementFilters = requirementFilters;
      if (facetFilters.length > 0) spellsQuery.tagFacetFilters = facetFilters;

      return await searchClient.search<Spell[]>(spellsQuery);
    },
    staleTime: 5_000
  });

  useEffect(() => 
  {
    if (!searchResults) return;

    // Przy filtrze postaci jedno zadanie miesci CALY jej repertuar
    // (`narrowToOwned` podnosi rozmiar strony do iloczynu rodzin i rang), wiec
    // nie ma czego doczytywac. Bez tego lista dogralaby sie dopiero przy
    // przewinieciu i strona 1 wygladala na dziwnie mala.
    setHasMore(ownedFilter ? false : searchResults.length === pageSize);
    const ownedResults = searchResults.filter(item => matchesOwned(ownedFilter, item));

    if (pageNumber === 1)
    {
      setDisplayedSpells(ownedResults);
      return;
    }

    setDisplayedSpells(prev => [...prev, ...ownedResults]);
  }, [pageNumber, searchResults, ownedKey]);

  const clearResults = useCallback(() =>
  {
    setDisplayedSpells(EMPTY_ARRAY);
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

  const handleFacetFiltersChange = useCallback((filters: TagFacetFilter[]) =>

  {

    setFacetFilters(filters);

    clearResults();

  }, [clearResults]);


  // Zmiana postaci to inny zbior wynikow: bez tego strona zostaje na

  // numerze 3, a nowe wyniki dokleily sie do starej listy.

  useEffect(() => { clearResults(); }, [ownedFilter, clearResults]);


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
    setDisplayedSpells(prev => prev.filter(spell => spell.id !== id));
  }, []);

  const toggleViewMode = useCallback(() => {
    setIsGroupedView(prev => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('spells-grouped-view', String(newValue));
      }
      return newValue;
    });
  }, []);

  const handleScopeToGroup = useCallback((groupName: string) => {
    setSearchInput(groupName);
    clearResults();
  }, [clearResults]);

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
        personalizationContext="spells"
        facetEntity="spells"
        facetFilters={facetFilters}
        handleFacetFiltersChange={handleFacetFiltersChange}
        extraFilters={<><RequirementFilter value={requirementFilters} onChange={handleRequirementFiltersChange} /><CharacterModeFilter kind="spells" onOwnedChange={setOwnedFilter} /></>}
      >
        <CastTimeFilter selectedCastTimes={selectedCastTimes} onSelectedCastTimesChange={handleSelectedCastTimesChange} />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleViewMode}
          title={isGroupedView ? "Switch to flat view" : "Switch to grouped view"}
        >
          {isGroupedView ? <List className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
        </Button>
        <AddSpellForm />
      </ListHeader>

      {isGroupedView ? (
        <GroupedItemsList<Spell>
          items={displayedSpells}
          renderItem={spell => <SpellView key={spell.id} spell={spell} onDelete={handleDelete} />}
          triggerNext={() => {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
          onScopeToGroup={handleScopeToGroup}
        />
      ) : (
        <WithScroll<Spell>
          parentClassName="flex flex-col gap-2"
          items={displayedSpells}
          triggerNext={() => 
          {
            setPageNumber(prev => prev + 1);
          }}
          hasMore={hasMore}
          renderItem={spell => <SpellView key={spell.id} spell={spell} onDelete={handleDelete} />}
        />
      )}
    </>
  );
};

function AddSpellForm()
{
  const initialValues: AddSpellDto = CreateDefaultSpell();

  const form = useForm<AddSpellDto>
  ({
    resolver: typedZodResolver(addSpellSchema),
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
        <PerkableAddSheet isPending={isPending} formId={formId} title={displayedText.addSpell} entityType="spells">
          <SpellEditableFields />
        </PerkableAddSheet>
      </form>
    </Form>
  )
}