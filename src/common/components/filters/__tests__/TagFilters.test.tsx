import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { UNASSIGNED_FACET_KEY, type TagFacetFilter, type TagFacetIndex } from '@/domain/tags/tagFacets';
import FacetedTagFilter from '../FacetedTagFilter';
import TagFilter from '../TagFilter';

const index: TagFacetIndex = {
  entity: 'armors',
  facets: [
    {
      key: 'role', label: 'Rola', order: 1, entities: ['armors'], selectionMode: 'multi', supportsNone: true,
      values: [
        { tag: 'defensywa', label: 'Obrona', spellings: ['defensywa', 'ochrona'] },
        { tag: 'ofensywa', label: 'Atak', spellings: ['ofensywa'] },
      ],
      allSpellings: ['defensywa', 'ochrona', 'ofensywa'],
    },
    {
      key: 'weight', label: 'Waga', order: 2, entities: ['armors'], selectionMode: 'single', supportsNone: true,
      values: [
        { tag: 'lekka', label: 'Lekka', spellings: ['lekka'] },
        { tag: 'ciężka', label: 'Ciężka', spellings: ['ciężka'] },
      ],
      allSpellings: ['lekka', 'ciężka'],
    },
    {
      key: UNASSIGNED_FACET_KEY, label: 'Pozostałe', order: 99, entities: ['armors'], selectionMode: 'multi', supportsNone: false,
      values: [{ tag: 'rzadki', label: 'Rzadki', spellings: ['rzadki'] }],
      allSpellings: ['rzadki'],
    },
  ],
  unassigned: ['rzadki'],
};

function renderFacets()
{
  const changed = vi.fn<(filters: TagFacetFilter[]) => void>();

  function Filters()
  {
    const [filters, setFilters] = useState<TagFacetFilter[]>([]);
    return <FacetedTagFilter index={index} filters={filters} onFiltersChange={next => {
      changed(next);
      setFilters(next);
    }} />;
  }

  render(<Filters />);
  fireEvent.click(screen.getByRole('button', { name: /^Filtruj/ }));
  return changed;
}

it('combines tags within a category, adds the unassigned selection and clears the filters', () => {
  const changed = renderFacets();
  fireEvent.click(screen.getByRole('button', { name: /^Rola/ }));
  const defense = screen.getByRole('button', { name: 'Obrona' });
  expect(defense).toHaveAttribute('title', 'dopasowuje: defensywa, ochrona');
  fireEvent.click(defense);
  fireEvent.click(screen.getByRole('button', { name: 'Atak' }));
  fireEvent.click(screen.getByRole('button', { name: '— brak —' }));
  fireEvent.click(screen.getByRole('button', { name: /^Pozostałe/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Rzadki' }));

  expect(changed).toHaveBeenLastCalledWith([
    { facetKey: 'role', tags: ['defensywa', 'ofensywa'], includeNone: true },
    { facetKey: UNASSIGNED_FACET_KEY, tags: ['rzadki'], includeNone: false },
  ]);
  fireEvent.click(within(screen.getByText(/Kategorie · wybrano/).parentElement!).getByRole('button', { name: 'Wyczyść' }));
  expect(changed).toHaveBeenLastCalledWith([]);
});

it('replaces a single-category choice and lets "tylko" remove the no-tag alternative', () => {
  const changed = renderFacets();
  fireEvent.click(screen.getByRole('button', { name: /^Waga/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Lekka' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ciężka' }));
  expect(changed).toHaveBeenLastCalledWith([{ facetKey: 'weight', tags: ['ciężka'], includeNone: false }]);

  fireEvent.click(screen.getByRole('button', { name: '— brak —' }));
  const light = screen.getByRole('button', { name: 'Lekka' });
  fireEvent.click(within(light.parentElement!).getByRole('button', { name: 'tylko' }));
  expect(changed).toHaveBeenLastCalledWith([{ facetKey: 'weight', tags: ['lekka'], includeNone: false }]);
});

it('selects only unclaimed flat tags and clears only the active mode', () => {
  const included = vi.fn<(tags: string[]) => void>();
  const excluded = vi.fn<(tags: string[]) => void>();

  function Filters()
  {
    const [includedTags, setIncluded] = useState(['obrona']);
    const [excludedTags, setExcluded] = useState(['wolny']);
    return <TagFilter
      includedTags={includedTags}
      excludedTags={excludedTags}
      availableTags={['obrona', 'wolny', 'szybki', 'mobilny']}
      onIncludedTagsChange={tags => { included(tags); setIncluded(tags); }}
      onExcludedTagsChange={tags => { excluded(tags); setExcluded(tags); }}
    />;
  }

  render(<Filters />);
  fireEvent.click(screen.getByRole('button', { name: 'Tryb wykluczania tagów' }));
  expect(screen.getByRole('button', { name: 'Tryb wykluczania tagów' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('combobox', { name: 'Wyklucz tag' }));
  fireEvent.click(screen.getByRole('button', { name: 'Zaznacz wszystkie' }));
  expect(excluded).toHaveBeenLastCalledWith(['wolny', 'szybki', 'mobilny']);
  expect(included).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole('combobox', { name: 'Wyklucz tag' }));
  fireEvent.click(screen.getByRole('button', { name: 'Odznacz wszystkie' }));
  expect(excluded).toHaveBeenLastCalledWith([]);
  expect(screen.getByRole('button', { name: 'obrona' })).toBeVisible();
});
