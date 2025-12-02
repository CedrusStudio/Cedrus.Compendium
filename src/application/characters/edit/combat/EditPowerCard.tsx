"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { UseFieldArrayRemove, useFormContext, useWatch } from "react-hook-form";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { displayedText } from '@/presentation/translations';
import { allowedPowerTypes, CreateDefaultSpell, pathToPowerField, pathToSpell, powerFieldOrder, Spell, type Power, PowerSpecification } from '@/domain/characters/combat/Power';
import { Separator } from '@/common/components/ui/separator';
import { PowerDto } from '@/persistence/schemas/characters/combat/powerSchema';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import SpellView from "@/application/compendium/spells/SpellView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState, useEffect, useRef } from 'react';
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import SummaryView from '@/application/common/SummaryView';
import EditCharacterCombatPerkSheet from '@/application/characters/edit/combat/EditCharacterCombatPerkSheet';
import SpellEditableFields from '@/application/common/combat/SpellEditableFields';
import { battleIcon, cooldownIcon, costIcon, importIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/presentation/colors';
import { createSpellKeysetQuery } from '@/infrastructure/searchQueries/spells/createSpellKeysetQuery';
import { createKeysetSearchSpellsKey } from '@/persistence/cacheKeys';
import PerkableEditView from '@/application/characters/edit/combat/PerkableEditView';
import { SelectPowerSpecificationSheet } from '@/application/characters/combat/SelectPowerSpecificationSheet';
import { Button } from '@/ui/button';
import PowerSpecificationViewFields from '@/application/common/combat/PowerSpecificationViewFields';
import powerSpecificationsClient from '@/infrastructure/clients/powerSpecificationsClient';
import { useQuery } from '@tanstack/react-query';

type EditPowersCardProps =
{
  index: number;
  power: Power;
  remove: UseFieldArrayRemove;
  isPending: boolean;
}

export default function EditPowerCard({ index, power, remove, isPending }: EditPowersCardProps)
{
  const { control, setValue } = useFormContext<CombatDto>();
  const { remove: removeSpell, watchedArray: spells, append: appendSpell } = useWatchedFormArray(pathToPowerField(index, 'spells'), control);
  const [importedSpellIds, setImportedSpellIds] = useState<Set<string>>(new Set());
  const [selectSpecOpen, setSelectSpecOpen] = useState(false);
  const prevIsPendingRef = useRef(isPending);

  // Watch the powerSpecificationId field to react to form changes
  const watchedPowerSpecId = useWatch
  ({
    control,
    name: pathToPowerField(index, 'powerSpecificationId')
  });

  // Fetch the PowerSpecification when component mounts or powerSpecificationId changes
  const { data: selectedSpecification } = useQuery
  ({
    queryKey: ['powerSpecification', watchedPowerSpecId],
    queryFn: () => powerSpecificationsClient.get(watchedPowerSpecId as string),
    enabled: !!watchedPowerSpecId && (watchedPowerSpecId as string).length > 0,
    staleTime: 5_000
  });

  useEffect(() =>
  {
    // Clear imported IDs when submission completes (isPending: true → false)
    if (prevIsPendingRef.current && !isPending)
    {
      setImportedSpellIds(new Set());
    }
    prevIsPendingRef.current = isPending;
  }, [isPending]);

  const handleSelectSpecification = (spec: PowerSpecification) => 
  {
    setValue(pathToPowerField(index, 'powerSpecificationId'), spec.id, { shouldDirty: true, shouldValidate: true });
  };

  const handleImportSpells = (importedSpells: Spell[]) => 
  {
    importedSpells.forEach(spell => 
    {
      appendSpell({ 
        id: spell.id,
        name: spell.name,
        grade: spell.grade,
        description: spell.description,
        requirements: [...spell.requirements],
        price: spell.price,
        tags: [...spell.tags],

        castTime: spell.castTime,
        cooldown: spell.cooldown,

        cost: spell.cost
      });
    });
    
    setImportedSpellIds(prev => 
    {
      const newSet = new Set(prev);
      importedSpells.forEach(spell => newSet.add(spell.id));
      return newSet;
    });
  };

  const renderSpellItem = (spell: Spell, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper key={spell.id} isSelected={isSelected} onToggle={() => onToggle(spell.id)} cannotSelect={spells.map(spell => spell.id).includes(spell.id)}>
        <SpellView spell={spell} disableEdit={true} />
      </SelectableItemWrapper>
    );
  };

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3'>
          
          <div className='flex flex-row flex-wrap item-center justify-center gap-4 mx-auto'>

            <div key={power.name} className="flex flex-col items-center gap-2">
              <Label className="text-center capitalize">{displayedText.name}</Label>
              <InputFormField<CombatDto> path={pathToPowerField(index, "name")} inputClassName='w-full h-10 text-center font-medium' />
            </div>

            <div className="grid grid-cols-3 justify-center items-center gap-3">
            { 
              (Object.keys(power) as (keyof PowerDto)[])
                .filter(NotNameOrTypeOrId)
                .sort(powerFieldOrder)
                .map(key => InputFormWithLabel(index, key as keyof PowerDto)) 
            }
            </div>

          </div>

          <div className='flex items-end justify-center gap-6 sm:mt-4'>
            <SelectFormField<CombatDto> path={pathToPowerField(index, "type")} items={allowedPowerTypes} />
            <RemoveFromArrayButton remove={remove} index={index} />
          </div>

        </CardTitle>
      </CardHeader>

      <CardContent>

        <div className='mb-4'>
          <div className='flex flex-row items-center justify-between gap-3 mb-2'>
            <Label className="text-lg font-semibold">Specyfikacja Mocy</Label>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setSelectSpecOpen(true)}
            >
              {importIcon}
              <span className='ml-2'>{selectedSpecification ? 'Zmień' : 'Wybierz'}</span>
            </Button>
          </div>
          
          {selectedSpecification ? (
            <PowerSpecificationViewFields powerSpecification={selectedSpecification} collapsible={true} defaultOpen={false} />
          ) : (
            <div className='p-4 border-2 border-dashed rounded-md text-center text-muted-foreground'>
              Nie wybrano specyfikacji mocy. Kliknij &quot;Wybierz&quot; aby wybrać.
            </div>
          )}
        </div>

        <SelectPowerSpecificationSheet
          open={selectSpecOpen}
          onOpenChange={setSelectSpecOpen}
          onSelect={handleSelectSpecification}
          currentSpecificationId={power.powerSpecificationId}
        />

        <Separator className='mb-5 col-span-full' />

        <div className='flex flex-col sm:flex-row items-center justify-center gap-6'>

          <div className='flex flex-row items-center gap-3'>
            <h2 className='text-2xl font-semibold text-primary capitalize'>{displayedText.spells}</h2>
            <AppendToArrayButton append={appendSpell} isPending={isPending} toAdd={CreateDefaultSpell} />

            <ImportItemsSheet
              importTitle={displayedText.import_spells}
              importDescription={displayedText.select_spells_to_import}
              onImport={handleImportSpells}
              isPending={isPending}
              currentItemsIds={spells.map(spell => spell.id)}
              renderItem={renderSpellItem}
              createKeysetQuery={createSpellKeysetQuery}
              createKeysetSearchKey={createKeysetSearchSpellsKey}
              entityType="spells"
            />

          </div>

          <div className='grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
          {
            spells.map((spell, spellIndex) => <EditSpellView key={spell.id} spell={spell} powerIndex={index} spellIndex={spellIndex} remove={removeSpell} isImported={importedSpellIds.has(spell.id)} />) 
          }
          </div>
        </div>
      </CardContent>

    </Card>
  );
};

function NotNameOrTypeOrId(key: keyof PowerDto): boolean
{
  return key !== 'name' && key !== 'type' && key !== 'id' && key !== 'spells' && key !== 'powerSpecificationId';
}

function InputFormWithLabel(index: number, powerFieldName: keyof PowerDto)
{   
  const fieldPath = pathToPowerField(index, powerFieldName);

  return (
    <div key={powerFieldName} className="flex flex-col items-center gap-2">
      <Label className="text-center capitalize">{displayedText[powerFieldName as keyof typeof displayedText]}</Label>
      <InputFormField<CombatDto> path={fieldPath} inputClassName='w-16 h-10 text-center font-medium' />
    </div>
  );
}

type EditSpellViewProps =
{
  spell: Spell;
  powerIndex: number;
  spellIndex: number;
  remove: UseFieldArrayRemove;
  isImported: boolean;
}

function EditSpellView({ spell, powerIndex, spellIndex, remove, isImported }: EditSpellViewProps)
{
  return (
    <PerkableEditView>

      <SummaryView entity={spell} tagsVariant="outline" />
      <ImportedBadge isImported={isImported} />

      <div className="flex flex-row gap-2">
        <Badge variant="cost" className="h-9 w-14 capitalize ">
          <div>{costIcon}</div>
          <div>{spell.cost}</div>
        </Badge>
        <Badge className='flex p-2 items-center justify-center rounded-r-md pointer-events-none' variant={getBadgeVariant(spell.castTime)}>
          {cooldownIcon()}
          <span>{spell.cooldown || battleIcon("scale-80")}</span>
        </Badge>
        <RemoveFromArrayButton remove={remove} index={spellIndex} />
        {!isImported && <EditSpellSheet spellIndex={spellIndex} powerIndex={powerIndex} />}
      </div>

    </PerkableEditView>
  );
}

type EditSpellSheetProps = 
{
  powerIndex: number;
  spellIndex: number;
};

function EditSpellSheet({ powerIndex, spellIndex }: EditSpellSheetProps)
{
  const type = pathToSpell(powerIndex, spellIndex);

  return (
    <EditCharacterCombatPerkSheet type={type} displayedTitle={displayedText.editSpell} >
      <SpellEditableFields pathPrefix={type + "."}  />
    </EditCharacterCombatPerkSheet>
  )
}