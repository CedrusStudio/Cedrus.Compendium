"use client";

import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/ui/sheet';
import { displayedText } from '@/common/translations';
import { importFromCharacterIcon } from '@/common/icons';
import { Entity } from '@/domain/Entity';
import { Character } from '@/domain/characters/Character';
import { useCharacterItemsSource } from '@/application/characters/import/useCharacterItemsSource';
import CharacterPickerGrid from '@/application/characters/components/CharacterPickerGrid';
import type { ImportItemState } from '@/common/components/import/ImportItemSheet';

const EMPTY_ARRAY: never[] = [];

type Step = 'select-character' | 'select-items';

type ImportFromCharacterSheetProps<TItem extends Entity> =
{
  /** Human readable category label shown in the sheet title, e.g. displayedText.maneuvers. */
  categoryLabel: string;
  currentCharacterId: string;
  currentCharacterName: string;
  currentItemsIds: string[];
  removedItemsIds?: string[];
  onToggleCurrentItem?: (id: string) => void;
  onToggleRemovedItem?: (id: string) => void;
  /** Extracts the relevant item collection (e.g. maneuvers, perks, equipment.weapons) from the source character. */
  itemsSelector: (character: Character) => TItem[];
  renderItem: (item: TItem, isSelected: boolean, onToggle: (id: string) => void, itemState: ImportItemState) => React.ReactNode;
  /** Called with the items to add — duplicates already present on the current character are already filtered out. */
  onImport: (items: TItem[]) => void;
  isPending: boolean;
};

/**
 * Two-step sheet: first pick a source character, then pick which of that
 * character's items (of a given category) to import into the currently
 * edited character. Mirrors `ImportItemsSheet`'s contract (same `renderItem`
 * signature, same `owned`/`removed`/`selected`/`available` item states) so
 * it plugs directly into `useDraftRemovableItems.registerImportedItems`.
 */
export default function ImportFromCharacterSheet<TItem extends Entity>
(
  {
    categoryLabel,
    currentCharacterId,
    currentCharacterName,
    currentItemsIds,
    removedItemsIds = EMPTY_ARRAY,
    onToggleCurrentItem,
    onToggleRemovedItem,
    itemsSelector,
    renderItem,
    onImport,
    isPending,
  }: ImportFromCharacterSheetProps<TItem>
)
{
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('select-character');
  const [sourceCharacterId, setSourceCharacterId] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItemsIds, setSelectedItemsIds] = useState<Set<string>>(new Set());

  const { sourceCharacter, isLoading, error } = useCharacterItemsSource
  ({
    characterId: sourceCharacterId,
    enabled: step === 'select-items' && !!sourceCharacterId,
  });

  const itemsFromSource: TItem[] = useMemo
  (
    () => sourceCharacter ? itemsSelector(sourceCharacter) : EMPTY_ARRAY,
    [sourceCharacter, itemsSelector]
  );

  const filteredItems = useMemo(() =>
  {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return itemsFromSource;
    return itemsFromSource.filter(item => item.name.toLowerCase().includes(query));
  }, [itemsFromSource, searchTerm]);

  const getItemState = useCallback((itemId: string): ImportItemState =>
  {
    if (removedItemsIds.includes(itemId)) return 'removed';
    if (currentItemsIds.includes(itemId)) return 'owned';
    if (selectedItemsIds.has(itemId)) return 'selected';
    return 'available';
  }, [currentItemsIds, removedItemsIds, selectedItemsIds]);

  const handleToggleItem = (itemId: string) =>
  {
    const itemState = getItemState(itemId);

    if (itemState === 'owned')
    {
      onToggleCurrentItem?.(itemId);
      return;
    }

    if (itemState === 'removed')
    {
      onToggleRemovedItem?.(itemId);
      return;
    }

    setSelectedItemsIds(prev =>
    {
      const newSet = new Set(prev);

      if (newSet.has(itemId))
      {
        newSet.delete(itemId);
        return newSet;
      }

      newSet.add(itemId);
      return newSet;
    });
  };

  const availableItems = filteredItems.filter(item => getItemState(item.id) === 'available');
  const allAvailableSelected = availableItems.length > 0 && availableItems.every(item => selectedItemsIds.has(item.id));

  const handleToggleAll = () =>
  {
    setSelectedItemsIds(prev =>
    {
      const next = new Set(prev);

      if (allAvailableSelected)
      {
        availableItems.forEach(item => next.delete(item.id));
        return next;
      }

      availableItems.forEach(item => next.add(item.id));
      return next;
    });
  };

  const resetState = useCallback(() =>
  {
    setStep('select-character');
    setSourceCharacterId(undefined);
    setSearchTerm("");
    setSelectedItemsIds(new Set());
  }, []);

  const handleSelectSourceCharacter = (characterId: string) =>
  {
    setSourceCharacterId(characterId);
    setStep('select-items');
    setSearchTerm("");
    setSelectedItemsIds(new Set());
  };

  const handleChangeSourceCharacter = () =>
  {
    setStep('select-character');
    setSourceCharacterId(undefined);
    setSelectedItemsIds(new Set());
  };

  const handleCancel = () =>
  {
    resetState();
    setOpen(false);
  };

  const handleImport = () =>
  {
    const selectedItems = itemsFromSource.filter(item => selectedItemsIds.has(item.id));
    const importedItems = selectedItems.filter(item => !currentItemsIds.includes(item.id));
    const skippedCount = selectedItems.length - importedItems.length;

    onImport(importedItems);

    const summaryTitle = `${displayedText.import_summary_imported_prefix} ${importedItems.length} ${displayedText.import_summary_elements_suffix}.`;

    if (skippedCount > 0)
    {
      toast(summaryTitle, {
        description: (
          <p className="mt-2 rounded-md bg-secondary p-4 text-primary">
            {displayedText.import_summary_skipped_prefix} {skippedCount} {displayedText.import_summary_skipped_suffix}.
          </p>
        ),
      });
    }
    else
    {
      toast(summaryTitle);
    }

    resetState();
    setOpen(false);
  };

  const selectedCount = selectedItemsIds.size;

  return (
    <Sheet
      open={open}
      onOpenChange={value =>
      {
        setOpen(value);
        if (!value) resetState();
      }}
    >

      <SheetTrigger asChild>
        <Button variant="outline" type="button" size="icon" disabled={isPending} title={displayedText.import_from_character}>
          {importFromCharacterIcon}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-full md:h-[90vh] overflow-y-auto">

        <SheetHeader>
          <SheetTitle className='first-letter:capitalize'>
            {categoryLabel} — {displayedText.import_from_character}
          </SheetTitle>
          <SheetDescription className='first-letter:capitalize'>
            {
              step === 'select-character'
                ? displayedText.select_source_character_description
                : `${displayedText.target_character}: ${currentCharacterName}`
            }
          </SheetDescription>
        </SheetHeader>

        {
          step === 'select-character'
            ? (
                <CharacterPickerGrid
                  onSelectCharacter={handleSelectSourceCharacter}
                  excludeCharacterId={currentCharacterId}
                />
              )
            : (
                <div className="flex flex-col gap-4">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-primary capitalize">{displayedText.source_character}:</span> {sourceCharacter?.name ?? '…'}
                    </div>
                    <Button variant="ghost" type="button" size="sm" onClick={handleChangeSourceCharacter}>
                      <span className='first-letter:capitalize'>{displayedText.change_source_character}</span>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Input
                      name="search"
                      type="text"
                      placeholder={displayedText.searchByName}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full sm:max-w-xs"
                    />

                    <div className="flex flex-row flex-wrap gap-2">
                      {
                        availableItems.length > 0 && (
                          <Button variant="outline" type="button" onClick={handleToggleAll}>
                            <span className='first-letter:capitalize'>{allAvailableSelected ? displayedText.deselect_all : displayedText.select_all}</span>
                          </Button>
                        )
                      }
                      <Button variant="default" type="button" onClick={handleImport} disabled={selectedCount === 0}>
                        <span className='first-letter:capitalize'>{displayedText.import} ({selectedCount})</span>
                      </Button>
                      <Button variant="ghost" type="button" onClick={handleCancel}>
                        <span className='first-letter:capitalize'>{displayedText.cancel}</span>
                      </Button>
                    </div>
                  </div>

                  {
                    isLoading && (
                      <div className="text-center text-muted-foreground py-8 capitalize">{displayedText.loading}</div>
                    )
                  }

                  {
                    !isLoading && error && (
                      <div className="text-center text-destructive py-8 capitalize">{displayedText.error}</div>
                    )
                  }

                  {
                    !isLoading && !error && filteredItems.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">{displayedText.no_items_on_source_character}</div>
                    )
                  }

                  <div className="flex flex-col gap-2">
                  {
                    filteredItems.map(item => renderItem(item, selectedItemsIds.has(item.id), handleToggleItem, getItemState(item.id)))
                  }
                  </div>
                </div>
              )
        }

      </SheetContent>
    </Sheet>
  );
}
