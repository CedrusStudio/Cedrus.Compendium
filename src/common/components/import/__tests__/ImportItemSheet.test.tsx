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

vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value],
}));

vi.mock('@/common/components/WithScroll', () => ({
  WithScroll: () => <div data-testid="with-scroll" />
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
});