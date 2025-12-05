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
import StateView from "@/application/compendium/states/StateView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState, useEffect, useRef } from 'react';
import { createKeysetSearchStatesKey } from '@/persistence/cacheKeys';
import { createStateKeysetQuery } from '@/infrastructure/searchQueries/states/createStateKeysetQuery';

type EditStatesCardProps = 
{
  isPending: boolean;
}

export default function EditStatesCard({ isPending }: EditStatesCardProps) 
{
  const { control } = useFormContext<CombatDto>();
  const { remove, watchedArray, append } = useWatchedFormArray("states", control);
  const [importedStateIds, setImportedStateIds] = useState<Set<string>>(new Set());
  const prevIsPendingRef = useRef(isPending);

  useEffect(() =>
  {
    // Clear imported IDs when submission completes (isPending: true → false)
    if (prevIsPendingRef.current && !isPending)
    {
      setImportedStateIds(new Set());
    }
    prevIsPendingRef.current = isPending;
  }, [isPending]);

  const handleImportStates = (importedStates: Mode[]) => 
  {
    importedStates.forEach(state => 
    {
      append({ 
        id: state.id,
        name: state.name,
        grade: state.grade,
        description: state.description,
        requirements: [...state.requirements],
        price: state.price,
        tags: [...state.tags]
      });
    });
    
    setImportedStateIds(prev => {
      const newSet = new Set(prev);
      importedStates.forEach(state => newSet.add(state.id));
      return newSet;
    });
  };

  const renderStateItem = (state: Mode, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper key={state.id} isSelected={isSelected} onToggle={() => onToggle(state.id)} cannotSelect={watchedArray.map(state => state.id).includes(state.id)}>
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
            renderItem={renderStateItem}
            createKeysetQuery={createStateKeysetQuery}
            createKeysetSearchKey={createKeysetSearchStatesKey}
            entityType="states"
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
            remove={remove}
            isImported={importedStateIds.has(state.id)}
          />
        ))
      }
      </CardContent>

    </Card>
  );
};
