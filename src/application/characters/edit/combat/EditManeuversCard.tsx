"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { CreateDefaultManeuver, pathToManeuvers, type Maneuver } from "@/domain/characters/combat/Maneuver";
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { useFormContext } from "react-hook-form";
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
import { useState } from 'react';
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import RemovedBadge from '@/common/components/labels/RemovedBadge';
import SummaryView from '@/application/common/SummaryView';
import EditCharacterCombatPerkSheet from './EditCharacterCombatPerkSheet';
import CastablePerkEditableFields from '@/application/common/combat/CastablePerkEditableFields';
import { createManeuverKeysetQuery } from '@/infrastructure/searchQueries/maneuvers/createManeuverKeysetQuery';
import { createKeysetSearchManeuversKey } from '@/persistence/cacheKeys';
import PerkableEditView from '@/application/characters/edit/combat/PerkableEditView';
import CastTimeFilter from '@/common/components/filters/CastTimeFilter';
import { normalizeGradeFilterInput, parseGradeFilterInput } from '@/common/global/gradeFilter';
import { type CastTime } from '@/domain/characters/Castable';
import RestoreItemButton from '@/common/components/form/RestoreItemButton';
import { useDraftRemovableItems } from '@/application/characters/edit/hooks/useDraftRemovableItems';

type EditManeuversCardProps = 
{
  isPending: boolean;
  isSuccess: boolean;
  initialManeuvers: Maneuver[];
}

const cloneManeuver = (maneuver: Maneuver): Maneuver =>
({
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

export default function EditManeuversCard({ isPending, isSuccess, initialManeuvers }: EditManeuversCardProps) 
{
  const { control } = useFormContext<CombatDto>();
  const { remove, watchedArray, append } = useWatchedFormArray("maneuvers", control);
  const [maneuverGradeFilter, setManeuverGradeFilter] = useState("");
  const [selectedCastTimes, setSelectedCastTimes] = useState<CastTime[]>([]);
  const selectedGrade = parseGradeFilterInput(maneuverGradeFilter);
  const {
    importedIds,
    registerImportedItems,
    removedItemIds,
    removedItems,
    removeItemAtIndex,
    removeItemById,
    restoreRemovedItem,
  } = useDraftRemovableItems<Maneuver>
  ({
    items: watchedArray,
    initialItems: initialManeuvers,
    isPending,
    isSuccess,
    append,
    remove,
    cloneItem: cloneManeuver,
  });

  const handleImportManeuvers = (importedManeuvers: Maneuver[]) => 
  {
    registerImportedItems(importedManeuvers);
  };

  const renderManeuverItem = (maneuver: Maneuver, isSelected: boolean, onToggle: (id: string) => void, itemState: 'available' | 'selected' | 'owned' | 'removed') => 
  {
    return (
      <SelectableItemWrapper key={maneuver.id} isSelected={isSelected} onToggle={() => onToggle(maneuver.id)} state={itemState}>
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
            removedItemsIds={removedItemIds}
            onToggleCurrentItem={removeItemById}
            onToggleRemovedItem={restoreRemovedItem}
            renderItem={renderManeuverItem}
            gradeFilter={maneuverGradeFilter}
            onGradeFilterChange={value => setManeuverGradeFilter(normalizeGradeFilterInput(value))}
            renderHeaderContent={({ clearResults }) => (
              <CastTimeFilter
                selectedCastTimes={selectedCastTimes}
                onSelectedCastTimesChange={castTimes =>
                {
                  clearResults();
                  setSelectedCastTimes(castTimes);
                }}
              />
            )}
            createKeysetQuery={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
              createManeuverKeysetQuery(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedCastTimes, selectedGrade)
            }
            createKeysetSearchKey={({ searchQuery, cursor, includeTags, pageSize, excludeTags }) =>
              createKeysetSearchManeuversKey(searchQuery, cursor, includeTags, pageSize, excludeTags, selectedCastTimes, selectedGrade)
            }
            entityType="maneuvers"
          />
        </CardTitle>
      </CardHeader>

      <CardContent className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 '>
      {
        watchedArray.map((maneuver, index) => <EditManeuverView key={maneuver.id} maneuver={maneuver} index={index} onRemove={() => removeItemAtIndex(index)} isImported={importedIds.has(maneuver.id)} isRemoved={false} />)
      }
      {
        removedItems.map(maneuver => <EditManeuverView key={maneuver.id} maneuver={maneuver} index={-1} onRestore={() => restoreRemovedItem(maneuver.id)} isImported={false} isRemoved={true} />)
      }
      </CardContent>

    </Card>
  );
};

type EditManeuverViewProps =
{
  maneuver: Maneuver;
  index: number;
  isImported: boolean;
  isRemoved: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
}

function EditManeuverView({ maneuver, index, isImported, isRemoved, onRemove, onRestore }: EditManeuverViewProps)
{
  return (
    <PerkableEditView>

      <SummaryView entity={maneuver} tagsVariant="outline" />
      {isRemoved ? <RemovedBadge /> : <ImportedBadge isImported={isImported} />}

      <div className="flex flex-row gap-2">
        <Badge className='flex p-2 items-center justify-center rounded-r-md pointer-events-none' variant={getBadgeVariant(maneuver.castTime)}>
          {cooldownIcon()}
          <span>{maneuver.cooldown || battleIcon("scale-80")}</span>
        </Badge>
        {isRemoved ? <RestoreItemButton onRestore={onRestore ?? (() => {})} /> : <RemoveFromArrayButton onRemove={onRemove} />}
        {!isRemoved && !isImported && <EditManeuverSheet index={index}/>}
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