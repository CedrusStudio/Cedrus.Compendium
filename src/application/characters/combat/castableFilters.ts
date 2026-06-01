import type { CastTime } from "@/domain/characters/Castable";

type SearchableCastable = {
  name: string;
  castTime: CastTime;
  tags: string[];
};

export type LocalCastableFilters = {
  searchTerm: string;
  selectedCastTimes: CastTime[];
  selectedTags: string[];
};

export function getAvailableCastableTags<T extends SearchableCastable>(castables: readonly T[]): string[]
{
  return [...new Set(castables.flatMap(castable => castable.tags))]
    .sort((left, right) => left.localeCompare(right));
}

export function filterCastables<T extends SearchableCastable>(castables: readonly T[], filters: LocalCastableFilters): T[]
{
  const normalizedSearchTerm = filters.searchTerm.trim().toLocaleLowerCase();

  return castables.filter(castable => {
    const matchesSearchTerm = normalizedSearchTerm.length === 0
      || castable.name.toLocaleLowerCase().includes(normalizedSearchTerm);
    const matchesCastTime = filters.selectedCastTimes.length === 0
      || filters.selectedCastTimes.includes(castable.castTime);
    const matchesTags = filters.selectedTags.length === 0
      || filters.selectedTags.every(tag => castable.tags.includes(tag));

    return matchesSearchTerm && matchesCastTime && matchesTags;
  });
}