"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import EditModeView from '@/application/characters/edit/combat/EditModeView';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { useFormContext } from 'react-hook-form';
import { CreateDefaultStance, Mode } from '@/domain/characters/combat/Mode';
import { displayedText } from '@/presentation/translations';
import ImportPerkableSheet from '@/application/characters/edit/ImportPerkableSheet';
import { useSearchStances } from '@/application/characters/edit/combat/hooks/useSearchStances';

type EditStancesCardProps =
{
  isPending: boolean;
}

export default function EditStancesCard({ isPending }: EditStancesCardProps)
{
  const { control } = useFormContext<CombatDto>();
  const { remove, watchedArray, append } = useWatchedFormArray("stances", control);

  const handleImportStances = (importedStances: Mode[]) => 
  {
    importedStances.forEach(stance => 
    {
      append({ 
        id: stance.id,
        name: stance.name,
        grade: stance.grade,
        description: stance.description,
        requirements: [...stance.requirements],
        price: stance.price,
        tags: [...stance.tags]
      });
    });
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
          <span>{displayedText.stances}</span>
          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultStance} />

          <ImportPerkableSheet
            importTitle={displayedText.import_stances}
            importDescription={displayedText.select_stances_to_import}
            notFoundText={displayedText.no_stances_found}
            onImport={handleImportStances}
            isPending={isPending}
            currentPerkableIds={watchedArray.map(stance => stance.id)}
            useSearchPerkables={useSearchStances}
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
            remove={remove} 
          />
        ))
      }
      </CardContent>

    </Card>
  );
};
