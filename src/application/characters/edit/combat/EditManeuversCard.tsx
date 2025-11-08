"use client";

import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { CreateDefaultManeuver, type Maneuver } from "@/domain/characters/combat/Maneuver";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { UseFieldArrayRemove, useFormContext } from "react-hook-form";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import { displayedText } from '@/presentation/translations';
import { battleIcon, cooldownIcon, editIcon } from '@/presentation/icons';
import { pathToManeuverField } from '@/domain/characters/combat/Maneuver';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/presentation/colors';
import FormTagsInput from '@/common/components/inputs/FormTagsInput';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import TagsView from '@/common/components/tags/TagsView';
import { Separator } from '@/common/components/ui/separator';
import FormStringsInput from '@/common/components/inputs/FormStringsInput';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import { useSearchManeuvers } from '@/application/characters/edit/combat/hooks/useSearchManeuvers';
import ManeuverView from "@/application/compendium/maneuvers/ManeuverView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState, useEffect, useRef } from 'react';
import ImportedBadge from "@/common/components/labels/ImportedBadge";

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
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(maneuver.id)}>
        <ManeuverView maneuver={maneuver} />
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
            notFoundText={displayedText.no_maneuvers_found}
            onImport={handleImportManeuvers}
            isPending={isPending}
            currentItemsIds={watchedArray.map(maneuver => maneuver.id)}
            useSearchItems={useSearchManeuvers}
            renderItem={renderManeuverItem}
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
    <div className="flex flex-col m-1 items-center border rounded-md p-2 min-h-24">

      <div className="flex flex-row gap-2 items-center min-h-24">
        <div className="p-2 rounded-md w-full">
          <h4 className="font-semibold">
            {maneuver.name} {maneuver.grade}
            <ImportedBadge isImported={isImported} />
          </h4>
          <p className="text-sm text-muted-foreground">{maneuver.description}</p>
        </div>

        <div className="flex flex-row gap-2">
          <Badge className='flex p-2 items-center justify-center rounded-r-md pointer-events-none' variant={getBadgeVariant(maneuver.castTime)}>
              {cooldownIcon()}
              <span>{maneuver.cooldown || battleIcon("scale-80")}</span>
          </Badge>
          <RemoveFromArrayButton remove={remove} index={index} />
          {!isImported && <EditManeuverSheet index={index}/>}
        </div>
      </div>

      <Separator className='mb-2' />
      <TagsView tags={maneuver.tags} variant="outline" />
    </div>
  );
}

type EditManeuverSheetProps = 
{
  index: number;
};

function EditManeuverSheet({ index}: EditManeuverSheetProps)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.editManeuver}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<CombatDto> path={pathToManeuverField(index, 'name')} inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<CombatDto> path={pathToManeuverField(index, 'grade')} inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<CombatDto> path={pathToManeuverField(index, 'description')} inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>
          
          <FormTagsInput<CombatDto> path={pathToManeuverField(index, 'tags')} />
          <FormStringsInput<CombatDto> path={pathToManeuverField(index, 'requirements')} placeholder={displayedText.addRequirement} />

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
              <InputFormField<CombatDto> path={pathToManeuverField(index, 'cooldown')} inputClassName='w-11 h-10 text-center font-medium' />
            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.price}</Label>
              <InputFormField<CombatDto> path={pathToManeuverField(index, 'price')} inputClassName='w-11 h-10 text-center font-medium'  />
            </div>
          </div>
  
          <div className="flex flex-col items-center gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
            <SelectFormField<CombatDto> path={pathToManeuverField(index, 'castTime')} labelText={displayedText.castTime} items={allowedCastTimes} />
          </div>

        </div>

        <SheetFooter>
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>

      </SheetContent>
    </Sheet>
  )
}