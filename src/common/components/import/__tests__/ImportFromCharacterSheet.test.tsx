import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders, screen, userEvent } from '@/__tests__/utils/testUtils';
import ImportFromCharacterSheet from '@/common/components/import/ImportFromCharacterSheet';
import type { Character } from '@/domain/characters/Character';

vi.mock('@/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode; side?: string; className?: string }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode; className?: string }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode; className?: string }) => <p>{children}</p>,
}));

vi.mock('@/common/translations', () => ({
  displayedText: {
    import_from_character: 'Importuj z innej postaci',
    select_source_character_description: 'Wybierz postać źródłową',
    target_character: 'Postać docelowa',
    source_character: 'Postać źródłowa',
    change_source_character: 'Zmień postać źródłową',
    select_all: 'Zaznacz wszystkie',
    deselect_all: 'Odznacz wszystkie',
    import: 'Importuj',
    cancel: 'Anuluj',
    loading: 'Ładowanie',
    error: 'Błąd',
    no_items_on_source_character: 'Brak elementów tego typu',
    searchByName: 'Szukaj po nazwie',
    import_summary_imported_prefix: 'Zaimportowano',
    import_summary_elements_suffix: 'elementów',
    import_summary_skipped_prefix: 'Pominięto',
    import_summary_skipped_suffix: 'elementów, ponieważ już istnieją na tej postaci',
  }
}));

const toastMock = vi.fn();
vi.mock('sonner', () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

type MockSourceState =
{
  sourceCharacter: Character | undefined;
  isLoading: boolean;
  error: Error | null;
};

let mockSourceState: MockSourceState = { sourceCharacter: undefined, isLoading: false, error: null };

vi.mock('@/application/characters/import/useCharacterItemsSource', () => ({
  useCharacterItemsSource: () => mockSourceState,
}));

vi.mock('@/application/characters/components/CharacterPickerGrid', () => ({
  default: ({ onSelectCharacter }: { onSelectCharacter: (id: string) => void }) => (
    <div data-testid="character-picker-grid">
      <button type="button" onClick={() => onSelectCharacter('source-character-1')}>
        Wybierz Rycerz Miecznik
      </button>
    </div>
  ),
}));

type TestItem = { id: string; name: string };

function makeSourceCharacter(): Character
{
  return {
    id: 'source-character-1',
    name: 'Rycerz Miecznik',
    // Only the fields exercised by the tests are populated — the rest of
    // `Character` isn't relevant to this component's logic (itemsSelector
    // is stubbed per-test instead of reading real character fields).
  } as unknown as Character;
}

function renderSheet(
  {
    currentItemsIds = [],
    removedItemsIds = [],
    onImport = vi.fn(),
    onToggleCurrentItem = vi.fn(),
    onToggleRemovedItem = vi.fn(),
    items = [{ id: 'atak-z-doskoku', name: 'Atak z doskoku' }, { id: 'kontratak', name: 'Kontratak' }],
  }:
  {
    currentItemsIds?: string[];
    removedItemsIds?: string[];
    onImport?: (items: TestItem[]) => void;
    onToggleCurrentItem?: (id: string) => void;
    onToggleRemovedItem?: (id: string) => void;
    items?: TestItem[];
  } = {}
)
{
  mockSourceState = { sourceCharacter: makeSourceCharacter(), isLoading: false, error: null };

  return renderWithProviders(
    <ImportFromCharacterSheet<TestItem>
      categoryLabel="Manewry"
      currentCharacterId="target-character-1"
      currentCharacterName="Wojak"
      currentItemsIds={currentItemsIds}
      removedItemsIds={removedItemsIds}
      onToggleCurrentItem={onToggleCurrentItem}
      onToggleRemovedItem={onToggleRemovedItem}
      itemsSelector={() => items}
      renderItem={(item, _isSelected, onToggle, itemState) => (
        <button key={item.id} type="button" onClick={() => onToggle(item.id)}>
          {`${item.name}:${itemState}`}
        </button>
      )}
      onImport={onImport}
      isPending={false}
    />
  );
}

describe('ImportFromCharacterSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSourceState = { sourceCharacter: undefined, isLoading: false, error: null };
  });

  it('shows the character picker first, then the source character items after selection', async () => {
    const user = userEvent.setup();
    renderSheet();

    expect(screen.getByTestId('character-picker-grid')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Atak z doskoku:available' })).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Wybierz Rycerz Miecznik' }));

    expect(await screen.findByRole('button', { name: 'Atak z doskoku:available' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Kontratak:available' })).toBeTruthy();
    expect(screen.getByText(/Rycerz Miecznik/)).toBeTruthy();
  });

  it('marks items already present on the target character as owned and routes their toggle to onToggleCurrentItem', async () => {
    const user = userEvent.setup();
    const onToggleCurrentItem = vi.fn();
    renderSheet({ currentItemsIds: ['atak-z-doskoku'], onToggleCurrentItem });

    await user.click(screen.getByRole('button', { name: 'Wybierz Rycerz Miecznik' }));
    await screen.findByRole('button', { name: 'Atak z doskoku:owned' });

    await user.click(screen.getByRole('button', { name: 'Atak z doskoku:owned' }));
    expect(onToggleCurrentItem).toHaveBeenCalledWith('atak-z-doskoku');
  });

  it('imports only the selected items, excludes duplicates already on the target, and reports a summary toast', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();

    // "kontratak" is already on the target character — selecting it must not
    // be importable a second time (it renders as owned, not selectable),
    // so only "atak-z-doskoku" ends up imported.
    renderSheet({ currentItemsIds: ['kontratak'], onImport });

    await user.click(screen.getByRole('button', { name: 'Wybierz Rycerz Miecznik' }));
    await screen.findByRole('button', { name: 'Atak z doskoku:available' });

    await user.click(screen.getByRole('button', { name: 'Atak z doskoku:available' }));
    await user.click(screen.getByRole('button', { name: 'Importuj (1)' }));

    expect(onImport).toHaveBeenCalledWith([{ id: 'atak-z-doskoku', name: 'Atak z doskoku' }]);
    expect(toastMock).toHaveBeenCalledWith('Zaimportowano 1 elementów.');
  });

  it('defensively excludes items that became duplicates between selection and import, and reports them as skipped', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    const { rerender } = renderSheet({ onImport });

    await user.click(screen.getByRole('button', { name: 'Wybierz Rycerz Miecznik' }));
    await screen.findByRole('button', { name: 'Atak z doskoku:available' });

    await user.click(screen.getByRole('button', { name: 'Atak z doskoku:available' }));
    await user.click(screen.getByRole('button', { name: 'Kontratak:available' }));

    // Simulate the item having been added elsewhere in the meantime, so it's
    // now a duplicate by the time the user actually clicks "Importuj".
    rerender(
      <ImportFromCharacterSheet<TestItem>
        categoryLabel="Manewry"
        currentCharacterId="target-character-1"
        currentCharacterName="Wojak"
        currentItemsIds={['atak-z-doskoku']}
        removedItemsIds={[]}
        onToggleCurrentItem={vi.fn()}
        onToggleRemovedItem={vi.fn()}
        itemsSelector={() => [{ id: 'atak-z-doskoku', name: 'Atak z doskoku' }, { id: 'kontratak', name: 'Kontratak' }]}
        renderItem={(item, _isSelected, onToggle, itemState) => (
          <button key={item.id} type="button" onClick={() => onToggle(item.id)}>
            {`${item.name}:${itemState}`}
          </button>
        )}
        onImport={onImport}
        isPending={false}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Importuj (2)' }));

    expect(onImport).toHaveBeenCalledWith([{ id: 'kontratak', name: 'Kontratak' }]);
    expect(toastMock).toHaveBeenCalledWith(
      'Zaimportowano 1 elementów.',
      expect.objectContaining({ description: expect.anything() })
    );
  });

  it('resets back to character selection on cancel without calling onImport', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn();
    renderSheet({ onImport });

    await user.click(screen.getByRole('button', { name: 'Wybierz Rycerz Miecznik' }));
    await screen.findByRole('button', { name: 'Atak z doskoku:available' });

    await user.click(screen.getByRole('button', { name: 'Atak z doskoku:available' }));
    await user.click(screen.getByRole('button', { name: 'Anuluj' }));

    expect(onImport).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('character-picker-grid')).toBeTruthy());
  });
});
