import React, { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders, screen, userEvent } from '@/__tests__/utils/testUtils';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import { createKeysetSearchSpellsKey } from '@/persistence/cacheKeys';
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import { normalizeGradeFilterInput, parseGradeFilterInput } from '@/common/global/gradeFilter';
import type { CastTime } from '@/domain/characters/Castable';

vi.mock('@/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode; side?: string; className?: string; id?: string }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode; className?: string }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode; className?: string }) => <p>{children}</p>,
}));

vi.mock('@/infrastructure/clients/searchClient', () => ({
  default: { search: vi.fn().mockResolvedValue([]) }
}));

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: () => ({ tags: [], isLoading: false })
}));

vi.mock('@/common/translations', () => ({
  displayedText: {
    select_all: 'Select all',
    deselect_all: 'Deselect all',
    import: 'Import',
    selected_items_hidden_by_filter: 'selected items hidden by filter',
  }
}));

vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value],
}));

vi.mock('@/common/components/WithScroll', () => ({
  WithScroll: ({ items, renderItem }: { items: Array<{ id: string; name: string }>; renderItem: (item: { id: string; name: string }) => React.ReactNode }) => (
    <div data-testid="with-scroll">
      {items.map(item => <div key={item.id}>{renderItem(item)}</div>)}
    </div>
  )
}));

vi.mock('@/common/components/lists/ListHeader', () => ({
  default: ({ children, handleGradeFilterChange }: { children: React.ReactNode; handleGradeFilterChange?: (event: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div data-testid="list-header">
      <button
        type="button"
        onClick={() =>
          handleGradeFilterChange?.({ target: { value: '7' } } as React.ChangeEvent<HTMLInputElement>)
        }
      >
        Set grade filter
      </button>
      {children}
    </div>
  )
}));

function SpellImportSheetHarness()
{
  const [gradeFilter, setGradeFilter] = useState('');
  const [selectedCastTimes, setSelectedCastTimes] = useState<CastTime[]>([]);
  const selectedGrade = parseGradeFilterInput(gradeFilter);

  return (
    <ImportItemsSheet<{ id: string; name: string }>
      importTitle="Import spells"
      importDescription="Select spells"
      onImport={vi.fn()}
      isPending={false}
      currentItemsIds={[]}
      renderItem={(item) => <div key={item.id}>{item.name}</div>}
      entityType="spells"
      gradeFilter={gradeFilter}
      onGradeFilterChange={value => setGradeFilter(normalizeGradeFilterInput(value))}
      renderHeaderContent={({ clearResults }) => (
        <button
          type="button"
          onClick={() =>
          {
            clearResults();
            setSelectedCastTimes(['Standardowa']);
          }}
        >
          Set cast time
        </button>
      )}
      createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
        createKeysetSearchSpellsKey(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedCastTimes, selectedGrade)
      }
      createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
        createSpellKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedCastTimes, selectedGrade)
      }
    />
  );
}

type TestItem = { id: string; name: string };

function StateAwareImportSheetHarness(
  {
    onImport = vi.fn(),
    onToggleCurrentItem = vi.fn(),
    onToggleRemovedItem = vi.fn(),
  }:
  {
    onImport?: (items: TestItem[]) => void;
    onToggleCurrentItem?: (id: string) => void;
    onToggleRemovedItem?: (id: string) => void;
  }
)
{
  return (
    <ImportItemsSheet<TestItem>
      importTitle="Import spells"
      importDescription="Select spells"
      onImport={onImport}
      isPending={false}
      currentItemsIds={['owned-1']}
      removedItemsIds={['removed-1']}
      onToggleCurrentItem={onToggleCurrentItem}
      onToggleRemovedItem={onToggleRemovedItem}
      renderItem={(item, _isSelected, onToggle, itemState) => (
        <button key={item.id} type="button" onClick={() => onToggle(item.id)}>
          {`${item.name}:${itemState}`}
        </button>
      )}
      entityType="spells"
      createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
        createKeysetSearchSpellsKey(searchQuery, cursor, includeTags, pageSize, excludeTags, [], undefined)
      }
      createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
        createSpellKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags, [], undefined)
      }
    />
  );
}

describe('ImportItemsSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes grade and custom filter state into import searches', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const user = userEvent.setup();

    renderWithProviders(<SpellImportSheetHarness />);

    await waitFor(() => expect(searchClient.search).toHaveBeenCalled());

    await user.click(screen.getByRole('button', { name: 'Set grade filter' }));
    await user.click(screen.getByRole('button', { name: 'Set cast time' }));

    await waitFor(() =>
      expect(searchClient.search).toHaveBeenLastCalledWith(
        expect.objectContaining({
          search: expect.objectContaining({
            grade: 7,
            castTime: { anyOf: ['Standardowa'] },
          }),
        })
      )
    );
  });

  it('routes toggles for owned and removed items outside the import selection set', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const onToggleCurrentItem = vi.fn();
    const onToggleRemovedItem = vi.fn();
    const user = userEvent.setup();

    vi.mocked(searchClient.search).mockResolvedValue([
      { id: 'owned-1', name: 'Owned spell' },
      { id: 'removed-1', name: 'Removed spell' },
      { id: 'available-1', name: 'Available spell' },
    ]);

    renderWithProviders(
      <StateAwareImportSheetHarness
        onToggleCurrentItem={onToggleCurrentItem}
        onToggleRemovedItem={onToggleRemovedItem}
      />
    );

    await screen.findByRole('button', { name: 'Owned spell:owned' });
    expect(screen.getByRole('button', { name: 'Removed spell:removed' })).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Owned spell:owned' }));
    await user.click(screen.getByRole('button', { name: 'Removed spell:removed' }));

    expect(onToggleCurrentItem).toHaveBeenCalledWith('owned-1');
    expect(onToggleRemovedItem).toHaveBeenCalledWith('removed-1');
  });

  it('selects and imports only available items', async () => {
    const { default: searchClient } = await import('@/infrastructure/clients/searchClient');
    const onImport = vi.fn();
    const user = userEvent.setup();

    vi.mocked(searchClient.search).mockResolvedValue([
      { id: 'owned-1', name: 'Owned spell' },
      { id: 'removed-1', name: 'Removed spell' },
      { id: 'available-1', name: 'Available spell 1' },
      { id: 'available-2', name: 'Available spell 2' },
    ]);

    renderWithProviders(<StateAwareImportSheetHarness onImport={onImport} />);

    await screen.findByRole('button', { name: 'Available spell 1:available' });
    await user.click(screen.getByRole('button', { name: 'Select all' }));
    await user.click(screen.getByRole('button', { name: 'Import (2)' }));

    expect(onImport).toHaveBeenCalledWith([
      { id: 'available-1', name: 'Available spell 1' },
      { id: 'available-2', name: 'Available spell 2' },
    ]);
  });
});