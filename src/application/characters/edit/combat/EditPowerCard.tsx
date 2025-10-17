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
import { allowedPowerTypes, CreateDefaultSpell, pathToPowerField, pathToSpellField, Spell, type Power } from '@/domain/characters/combat/Power';
import { Separator } from '@/common/components/ui/separator';
import { PowerDto } from '@/persistence/schemas/characters/combat/powerSchema';
import useWatchedFormArray from '@/infrastructure/hooks/useWatchedFormArray';

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

  return (
    <Card className='bg-muted'>

      <CardHeader>
        <CardTitle className='flex flex-row items-center justify-between gap-3'>
          <div className='flex flex-row gap-10 mx-auto'>

            <div key={power.name} className="flex flex-col items-center gap-2">
              <Label className="text-center capitalize">{displayedText.name}</Label>
              <InputFormField<CombatDto> path={pathToPowerField(index, "name")} inputClassName='w-full h-10 text-center font-medium' />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 justify-center items-center gap-3">
            { 
              (Object.keys(power) as (keyof PowerDto)[])
                .filter(NotNameOrTypeOrId)
                .map(key => InputFormWithLabel(index, key as keyof PowerDto)) 
            }
            </div>
          </div>

          <div className='flex items-end justify-center gap-6'>
            <SelectFormField<CombatDto> path={pathToPowerField(index, "type")} items={allowedPowerTypes} />
            <RemoveFromArrayButton remove={remove} index={index} />
          </div>

        </CardTitle>
      </CardHeader>

      <CardContent>

        <Separator className='mb-5 col-span-full' />

        <div className='flex flex-row gap-6'>

          <div className='flex flex-row items-center gap-3'>
            <h2 className='text-2xl font-semibold text-primary capitalize'>{displayedText.spells}</h2>
            <AppendToArrayButton append={appendSpell} isPending={isPending} toAdd={CreateDefaultSpell} />
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'>
          {
            spells.map((spell, spellIndex) => <EditSpellView key={spell.id} spell={spell} powerIndex={index} spellIndex={spellIndex} remove={removeSpell} />) 
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
}

function EditSpellView({ spell, powerIndex, spellIndex, remove }: EditSpellViewProps)
{
  return (
    <div className="flex flex-row gap-4 m-1 items-center border rounded-md p-2 min-h-24">
      <div className="p-2 rounded-md w-full">
        <h4 className="font-semibold">{spell.name} {spell.grade}</h4>
        <p className="text-sm text-muted-foreground">{spell.description}</p>
      </div>

      <div className="flex flex-row gap-2">
        <RemoveFromArrayButton remove={remove} index={spellIndex} />
        <EditSpellSheet spellIndex={spellIndex} powerIndex={powerIndex} />
      </div>
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
        
          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize justify-center'>{displayedText.requirements}</Label>
            <InputFormField<CombatDto> path={pathToSpellField(powerIndex, spellIndex, 'requirements')} inputClassName='w-80' />
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