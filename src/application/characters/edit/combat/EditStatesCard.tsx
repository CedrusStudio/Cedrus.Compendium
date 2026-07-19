"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import EditModeView from '@/application/characters/edit/combat/EditModeView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { useFormContext } from 'react-hook-form';
import { CreateDefaultState, Mode } from '@/domain/characters/combat/Mode';
import { displayedText } from '@/common/translations';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import ImportFromCharacterSheet from '@/common/components/import/ImportFromCharacterSheet';
import StateView from "@/application/compendium/states/StateView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState } from 'react';
import { createKeysetSearchStatesKey } from '@/persistence/cacheKeys';
import { createStateKeysetQuery } from '@/infrastructure/searchQueries/states/createStateKeysetQuery';
import { normalizeGradeFilterInput, parseGradeFilterInput } from '@/common/global/gradeFilter';
import { useDraftRemovableItems } from '@/application/characters/edit/hooks/useDraftRemovableItems';

type EditStatesCardProps =
{
  isPending: boolean;
  isSuccess: boolean;
  initialStates: Mode[];
  currentCharacterId: string;
  currentCharacterName: string;
}

const cloneMode = (mode: Mode): Mode =>
({
  id: mode.id,
  name: mode.name,
  grade: mode.grade,
  description: mode.description,
  requirements: [...mode.requirements],
  price: mode.price,
  tags: [...mode.tags]
});

export default function EditStatesCard({ isPending, isSuccess, initialStates, currentCharacterId, currentCharacterName }: EditStatesCardProps)
{
  const { control } = useFormContext<CombatDto>();
  const { remove, watchedArray, append } = useWatchedFormArray("states", control);
  const [gradeFilter, setGradeFilter] = useState("");
  const selectedGrade = parseGradeFilterInput(gradeFilter);
  const {
    importedIds,
    registerImportedItems,
    removedItemIds,
    removedItems,
    removeItemAtIndex,
    removeItemById,
    restoreRemovedItem,
  } = useDraftRemovableItems<Mode>
  ({
    items: watchedArray,
    initialItems: initialStates,
    isPending,
    isSuccess,
    append,
    remove,
    cloneItem: cloneMode,
  });

  const handleImportStates = (importedStates: Mode[]) => 
  {
    registerImportedItems(importedStates);
  };

  const renderStateItem = (state: Mode, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') => 
  {
    return (
      <SelectableItemWrapper key={state.id} isSelected={isSelected} onToggle={() => onToggle(state.id)} state={itemState}>
        <StateView state={state} disableEdit={true} />
      </SelectableItemWrapper>
    );
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
          <span>{displayedText.states}</span>
          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultState} />

          <ImportItemsSheet
            importTitle={displayedText.import_states}
            importDescription={displayedText.select_states_to_import}
            onImport={handleImportStates}
            isPending={isPending}
            currentItemsIds={watchedArray.map(state => state.id)}
            removedItemsIds={removedItemIds}
            onToggleCurrentItem={removeItemById}
            onToggleRemovedItem={restoreRemovedItem}
            renderItem={renderStateItem}
            gradeFilter={gradeFilter}
            onGradeFilterChange={value => setGradeFilter(normalizeGradeFilterInput(value))}
            createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
              createStateKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedGrade)
            }
            createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
              createKeysetSearchStatesKey(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedGrade)
            }
            entityType="states"
          />

          <ImportFromCharacterSheet<Mode>
            categoryLabel={displayedText.states}
            currentCharacterId={currentCharacterId}
            currentCharacterName={currentCharacterName}
            currentItemsIds={watchedArray.map(state => state.id)}
            removedItemsIds={removedItemIds}
            onToggleCurrentItem={removeItemById}
            onToggleRemovedItem={restoreRemovedItem}
            itemsSelector={character => character.states}
            renderItem={renderStateItem}
            onImport={handleImportStates}
            isPending={isPending}
          />
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
      {
        watchedArray.map((state, index) => (
          <EditModeView 
            mode={state}
            key={state.id} 
            modeType='states' 
            index={index} 
            onRemove={() => removeItemAtIndex(index)}
            isImported={importedIds.has(state.id)}
            isRemoved={false}
          />
        ))
      }
      {
        removedItems.map(state => (
          <EditModeView
            mode={state}
            key={state.id}
            modeType='states'
            index={-1}
            onRestore={() => restoreRemovedItem(state.id)}
            isImported={false}
            isRemoved={true}
          />
        ))
      }
      </CardContent>

    </Card>
  );
};
