"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import EditModeView from '@/application/characters/edit/combat/EditModeView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { useFormContext } from 'react-hook-form';
import { CreateDefaultStance, Mode } from '@/domain/characters/combat/Mode';
import { displayedText } from '@/common/translations';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import StanceView from "@/application/compendium/stances/StanceView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState } from 'react';
import { createKeysetSearchStancesKey } from '@/persistence/cacheKeys';
import { createStanceKeysetQuery } from '@/infrastructure/searchQueries/stances/createStanceKeysetQuery';
import { normalizeGradeFilterInput, parseGradeFilterInput } from '@/common/global/gradeFilter';
import { useDraftRemovableItems } from '@/application/characters/edit/hooks/useDraftRemovableItems';

type EditStancesCardProps = 
{
  isPending: boolean;
  isSuccess: boolean;
  initialStances: Mode[];
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

export default function EditStancesCard({ isPending, isSuccess, initialStances }: EditStancesCardProps) 
{
  const { control } = useFormContext<CombatDto>();
  const { remove, watchedArray, append } = useWatchedFormArray("stances", control);
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
    initialItems: initialStances,
    isPending,
    isSuccess,
    append,
    remove,
    cloneItem: cloneMode,
  });

  const handleImportStances = (importedStances: Mode[]) => 
  {
    registerImportedItems(importedStances);
  };

  const renderStanceItem = (stance: Mode, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') => 
  {
    return (
      <SelectableItemWrapper key={stance.id} isSelected={isSelected} onToggle={() => onToggle(stance.id)} state={itemState}>
        <StanceView stance={stance} disableEdit={true} />
      </SelectableItemWrapper>
    );
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
          <span>{displayedText.stances}</span>
          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultStance} />

          <ImportItemsSheet
            importTitle={displayedText.import_stances}
            importDescription={displayedText.select_stances_to_import}
            onImport={handleImportStances}
            isPending={isPending}
            currentItemsIds={watchedArray.map(stance => stance.id)}
            removedItemsIds={removedItemIds}
            onToggleCurrentItem={removeItemById}
            onToggleRemovedItem={restoreRemovedItem}
            renderItem={renderStanceItem}
            gradeFilter={gradeFilter}
            onGradeFilterChange={value => setGradeFilter(normalizeGradeFilterInput(value))}
            createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
              createStanceKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedGrade)
            }
            createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
              createKeysetSearchStancesKey(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedGrade)
            }
            entityType="stances"
          />
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2'>
      {
        watchedArray.map((stance, index) => (
          <EditModeView 
            mode={stance}
            key={stance.id} 
            modeType='stances' 
            index={index} 
            onRemove={() => removeItemAtIndex(index)}
            isImported={importedIds.has(stance.id)}
            isRemoved={false}
          />
        ))
      }
      {
        removedItems.map(stance => (
          <EditModeView
            mode={stance}
            key={stance.id}
            modeType='stances'
            index={-1}
            onRestore={() => restoreRemovedItem(stance.id)}
            isImported={false}
            isRemoved={true}
          />
        ))
      }
      </CardContent>

    </Card>
  );
};
