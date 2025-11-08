"use client";

import { Button } from '@/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { UseFieldArrayRemove, useFormContext } from "react-hook-form";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import AppendToArrayButton from '@/common/components/form/AppendToArrayButton';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { allowedPowerTypes, CreateDefaultSpell, pathToPowerField, pathToSpellField, powerFieldOrder, Spell, type Power } from '@/domain/characters/combat/Power';
import { Separator } from '@/common/components/ui/separator';
import { PowerDto } from '@/persistence/schemas/characters/combat/powerSchema';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';
import TagsView from '@/common/components/tags/TagsView';
import FormTagsInput from '@/common/components/inputs/FormTagsInput';
import { FormStringsInput } from '@/common/components/inputs/FormStringsInput';
import ImportItemsSheet from '@/common/components/import/ImportItemSheet';
import { useSearchSpells } from '@/application/characters/edit/combat/hooks/useSearchSpells';
import SpellView from "@/application/compendium/spells/SpellView";
import SelectableItemWrapper from "@/common/components/import/SelectableItemWrapper";
import { useState, useEffect, useRef } from 'react';
import ImportedBadge from "@/common/components/labels/ImportedBadge";

type EditPowersCardProps =
{
  index: number;
  power: Power;
  remove: UseFieldArrayRemove;
  isPending: boolean;
}

export default function EditPowerCard({ index, power, remove, isPending }: EditPowersCardProps)
{
  const { control } = useFormContext<CombatDto>();
  const { remove: removeSpell, watchedArray: spells, append: appendSpell } = useWatchedFormArray(pathToPowerField(index, 'spells'), control);
  const [importedSpellIds, setImportedSpellIds] = useState<Set<string>>(new Set());
  const prevIsPendingRef = useRef(isPending);

  useEffect(() =>
  {
    // Clear imported IDs when submission completes (isPending: true → false)
    if (prevIsPendingRef.current && !isPending)
    {
      setImportedSpellIds(new Set());
    }
    prevIsPendingRef.current = isPending;
  }, [isPending]);

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
    
    setImportedSpellIds(prev => {
      const newSet = new Set(prev);
      importedSpells.forEach(spell => newSet.add(spell.id));
      return newSet;
    });
  };

  const renderSpellItem = (spell: Spell, isSelected: boolean, onToggle: (id: string) => void) => 
  {
    return (
      <SelectableItemWrapper isSelected={isSelected} onToggle={() => onToggle(spell.id)}>
        <SpellView spell={spell} />
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

        <Separator className='mb-5 col-span-full' />

        <div className='flex flex-col sm:flex-row items-center justify-center gap-6'>

          <div className='flex flex-row items-center gap-3'>
            <h2 className='text-2xl font-semibold text-primary capitalize'>{displayedText.spells}</h2>
            <AppendToArrayButton append={appendSpell} isPending={isPending} toAdd={CreateDefaultSpell} />

            <ImportItemsSheet
              importTitle={displayedText.import_spells}
              importDescription={displayedText.select_spells_to_import}
              notFoundText={displayedText.no_spells_found}
              onImport={handleImportSpells}
              isPending={isPending}
              currentItemsIds={spells.map(spell => spell.id)}
              useSearchItems={useSearchSpells}
              renderItem={renderSpellItem}
            />

          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'>
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
  return key !== 'name' && key !== 'type' && key !== 'id' && key !== 'spells';
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
    <div className="flex flex-col m-1 items-center border rounded-md p-2 min-h-24">

      <div className="flex flex-row gap-2 items-center min-h-24">
        <div className="p-2 rounded-md w-full">
          <h4 className="font-semibold">
            {spell.name} {spell.grade}
            <ImportedBadge isImported={isImported} />
          </h4>
          <p className="text-sm text-muted-foreground">{spell.description}</p>
        </div>

        <div className="flex flex-row gap-2">
          <RemoveFromArrayButton remove={remove} index={spellIndex} />
          {!isImported && <EditSpellSheet spellIndex={spellIndex} powerIndex={powerIndex} />}
        </div>
      </div>

      <Separator className='mb-2' />
      <TagsView tags={spell.tags} variant="outline" />
    </div>
  );
}

type EditSpellSheetProps = 
{
  powerIndex: number;
  spellIndex: number;
};

function EditSpellSheet({ powerIndex, spellIndex }: EditSpellSheetProps)
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.editSpell}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'name')} inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'grade')} inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <InputFormField<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'description')} inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'tags')} />
          <FormStringsInput<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'requirements')} placeholder={displayedText.addRequirement} />

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize justify-center'>{displayedText.cooldown}</Label>
              <InputFormField<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'cooldown')} inputClassName='w-11 h-10 text-center font-medium' />
            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize justify-center'>{displayedText.castTime}</Label>
              <SelectFormField<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'castTime')} labelText={displayedText.castTime} items={allowedCastTimes} />
            </div>
            
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize justify-center'>{displayedText.cost}</Label>
              <InputFormField<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'cost')} inputClassName='w-16 h-10 text-center font-medium' />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize justify-center'>{displayedText.price}</Label>
              <InputFormField<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'price')} inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            
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