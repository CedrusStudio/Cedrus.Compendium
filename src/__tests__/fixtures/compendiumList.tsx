import type { ComponentProps, ReactNode } from 'react';
import type { TagFacetFilter } from '@/domain/tags/tagFacets';
import type { RequirementSearchFilter } from '@/common/global/SearchPayloads';
import type ListHeader from '@/common/components/lists/ListHeader';

export const requirementFilter = { kind: 'text', text: 'trening' } satisfies RequirementSearchFilter;
export const facetFilter = { facetKey: 'role', tags: ['obrona'] } satisfies TagFacetFilter;

export function ListControls({
  children, searchInput, handleSearchInputChange, handleGradeFilterChange,
  handleSearchTagsChange, handleExcludedTagsChange, handleFacetFiltersChange, extraFilters,
}: ComponentProps<typeof ListHeader>)
{
  return (
    <div>
      <input aria-label="Search by name" value={searchInput} onChange={handleSearchInputChange} />
      <input aria-label="Filter by grade" onChange={handleGradeFilterChange} />
      <button type="button" onClick={() => handleSearchTagsChange(['walka'])}>Include combat</button>
      <button type="button" onClick={() => handleExcludedTagsChange(['dystans'])}>Exclude ranged</button>
      <button type="button" onClick={() => handleFacetFiltersChange?.([facetFilter])}>Filter defense facet</button>
      {extraFilters}
      {children}
    </div>
  );
}

export function RequirementControl({ onChange }: { onChange: (filters: RequirementSearchFilter[]) => void })
{
  return <button type="button" onClick={() => onChange([requirementFilter])}>Filter training requirement</button>;
}

type TestListProps = {
  items: { id: string }[];
  renderItem: (item: { id: string }, index: number) => ReactNode;
  hasMore?: boolean;
  triggerNext: () => void;
  onScopeToGroup?: (name: string) => void;
};

export function Results({ items, renderItem, hasMore, triggerNext, onScopeToGroup }: TestListProps)
{
  return (
    <div aria-label={onScopeToGroup ? 'Grouped results' : 'Flat results'} role="region">
      {items.map(renderItem)}
      {hasMore && <button type="button" onClick={triggerNext}>Load next page</button>}
      {onScopeToGroup && <button type="button" onClick={() => onScopeToGroup('Zasłona')}>Search this group</button>}
    </div>
  );
}
