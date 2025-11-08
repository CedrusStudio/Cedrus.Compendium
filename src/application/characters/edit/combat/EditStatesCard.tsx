"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import EditModeView from '@/application/characters/edit/combat/EditModeView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { useFormContext } from 'react-hook-form';
import { CreateDefaultState, Mode } from '@/domain/characters/combat/Mode';
import { displayedText } from '@/presentation/translations';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import { useSearchStates } from '@/application/characters/edit/combat/hooks/useSearchStates';
import StateView from "@/application/compendium/states/StateView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState, useEffect, useRef } from 'react';

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
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(state.id)}>
        <StateView state={state} />
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
            notFoundText={displayedText.no_states_found}
            onImport={handleImportStates}
            isPending={isPending}
            currentItemsIds={watchedArray.map(state => state.id)}
            useSearchItems={useSearchStates}
            renderItem={renderStateItem}
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
