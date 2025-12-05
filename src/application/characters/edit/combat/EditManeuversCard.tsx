"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { CreateDefaultManeuver, pathToManeuvers, type Maneuver } from "@/domain/characters/combat/Maneuver";
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { UseFieldArrayRemove, useFormContext } from "react-hook-form";
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { displayedText } from '@/common/translations';
import { battleIcon, cooldownIcon } from '@/common/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/common/colors';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import ManeuverView from "@/application/compendium/maneuvers/ManeuverView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState, useEffect, useRef } from 'react';
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import SummaryView from '@/application/common/SummaryView';
import EditCharacterCombatPerkSheet from './EditCharacterCombatPerkSheet';
import CastablePerkEditableFields from '@/application/common/combat/CastablePerkEditableFields';
import { createManeuverKeysetQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery';
import { createKeysetSearchManeuversKey } from '@/persistence/cacheKeys';
import PerkableEditView from '@/application/characters/edit/combat/PerkableEditView';

type EditManeuversCardProps = 
{
  isPending: boolean;
}

export default function EditManeuversCard({ isPending }: EditManeuversCardProps) 
{
  const { control } = useFormContext<CombatDto>();
  const { remove, watchedArray, append } = useWatchedFormArray("maneuvers", control);
  const [importedManeuverIds, setImportedManeuverIds] = useState<Set<string>>(new Set());
  const prevIsPendingRef = useRef(isPending);

  useEffect(() =>
  {
    // Clear imported IDs when submission completes (isPending: true → false)
    if (prevIsPendingRef.current && !isPending)
    {
      setImportedManeuverIds(new Set());
    }
    prevIsPendingRef.current = isPending;
  }, [isPending]);

  const handleImportManeuvers = (importedManeuvers: Maneuver[]) => 
  {
    importedManeuvers.forEach(maneuver => 
    {
      append({ 
        id: maneuver.id,
        name: maneuver.name,
        grade: maneuver.grade,
        description: maneuver.description,
        requirements: [...maneuver.requirements],
        price: maneuver.price,
        tags: [...maneuver.tags],

        castTime: maneuver.castTime,
        cooldown: maneuver.cooldown
      });
    });
    
    setImportedManeuverIds(prev => {
      const newSet = new Set(prev);
      importedManeuvers.forEach(maneuver => newSet.add(maneuver.id));
      return newSet;
    });
  };

  const renderManeuverItem = (maneuver: Maneuver, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper key={maneuver.id} isSelected={isSelected} onToggle={() => onToggle(maneuver.id)} cannotSelect={watchedArray.map(maneuver => maneuver.id).includes(maneuver.id)}>
        <ManeuverView maneuver={maneuver} disableEdit={true} />
      </SelectableItemWrapper>
    );
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='font-bold text-2xl capitalize text-center text-primary flex items-center justify-center gap-3'>
          <span className='capitalize'>{displayedText.maneuvers}</span>
          <AppendToArrayButton append={append} isPending={isPending} toAdd={CreateDefaultManeuver} />

          <ImportItemsSheet
            importTitle={displayedText.import_maneuvers}
            importDescription={displayedText.select_maneuvers_to_import}
            onImport={handleImportManeuvers}
            isPending={isPending}
            currentItemsIds={watchedArray.map(maneuver => maneuver.id)}
            renderItem={renderManeuverItem}
            createKeysetQuery={createManeuverKeysetQuery}
            createKeysetSearchKey={createKeysetSearchManeuversKey}
            entityType="maneuvers"
          />
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 '>
      {
        watchedArray.map((maneuver, index) => <EditManeuverView key={maneuver.id} maneuver={maneuver} index={index} remove={remove} isImported={importedManeuverIds.has(maneuver.id)} />)
      }
      </CardContent>

    </Card>
  );
};

type EditManeuverViewProps =
{
  maneuver: Maneuver;
  index: number;
  remove: UseFieldArrayRemove;
  isImported: boolean;
}

function EditManeuverView({ maneuver, index, remove, isImported }: EditManeuverViewProps)
{
  return (
    <PerkableEditView>

      <SummaryView entity={maneuver} tagsVariant="outline" />
      <ImportedBadge isImported={isImported} />

      <div className="flex flex-row gap-2">
        <Badge className='flex p-2 items-center justify-center rounded-r-md pointer-events-none' variant={getBadgeVariant(maneuver.castTime)}>
          {cooldownIcon()}
          <span>{maneuver.cooldown || battleIcon("scale-80")}</span>
        </Badge>
        <RemoveFromArrayButton remove={remove} index={index} />
        {!isImported && <EditManeuverSheet index={index}/>}
      </div>

    </PerkableEditView>
  );
}

type EditManeuverSheetProps = 
{
  index: number;
};

function EditManeuverSheet({ index }: EditManeuverSheetProps)
{
  const type = pathToManeuvers(index);

  return (
    <EditCharacterCombatPerkSheet type={type} displayedTitle={displayedText.editManeuver} >
      <CastablePerkEditableFields pathPrefix={type + "."}  />
    </EditCharacterCombatPerkSheet>
  )
}