"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import client from "@/infrastructure/clients/equipment/weaponsClient";
import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Weapon } from "@/domain/characters/equipment/Weapon";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteWeaponById } from '@/application/compendium/equipment/weapons/hooks/useDeleteWeaponById';
import { WeaponDto, weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { allowedStyles } from "@/domain/characters/equipment/Weapon";
import { allowedDiceGrades } from "@/domain/characters/combat/Offense";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";

type WeaponViewProps =
{
  weapon: Weapon;
  disableEdit?: boolean;
}

export default function WeaponView({ weapon, disableEdit = false }: WeaponViewProps)
{
  const { deleteWeapon, isPending } = useDeleteWeaponById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">

      <SummaryView entity={weapon} />

      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 px-2 capitalize">
          <div className="text-xs">{displayedText.style}:</div>
          <div className="ml-1">{weapon.style}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.offense}:</div>
          <div className="ml-1">{weapon.offense.amount}k{weapon.offense.grade}+{weapon.offense.bonus}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.damage}:</div>
          <div className="ml-1">{weapon.damageBonus.amount}k{weapon.damageBonus.grade}+{weapon.damageBonus.bonus}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.critical}:</div>
          <div className="ml-1">{weapon.offense.critical.power}/{weapon.offense.critical.range}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.range}:</div>
          <div className="ml-1">{weapon.range}</div>
        </Badge>

        {
          !disableEdit && (
            <>
              <DeleteButton id={weapon.id} isPending={isPending} deleteAction={deleteWeapon} />

              <EditFormForSheet<WeaponDto> 
                entityId={weapon.id}
                defaultValues={weapon}
                schema={weaponSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.weapon(weapon.id)}
                renderSheetContent={(isPending, formId) => <EditWeaponSheet isPending={isPending} formId={formId} />}
                cacheKeys={['weapons']}
              />

            </>
          )
        }
      </div>

    </div>
  );
}

function EditWeaponSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.edit} {displayedText.weapons}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<WeaponDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<WeaponDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<WeaponDto> path='tags' />

          <div className="flex flex-col items-center gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.style}</span></Label>
            <SelectFormField<WeaponDto> path='style' labelText={displayedText.style} items={allowedStyles} />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='justify-center capitalize'>{displayedText.range}</Label>
            <InputFormField<WeaponDto> path='range' inputClassName='w-11 h-10 text-center font-medium' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='font-semibold text-base'>{displayedText.offense}</Label>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.amount}</Label>
                <InputFormField<WeaponDto> path='offense.amount' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.grade}</Label>
                <SelectFormField<WeaponDto> path='offense.grade' labelText={displayedText.grade} items={allowedDiceGrades} />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.bonus}</Label>
                <InputFormField<WeaponDto> path='offense.bonus' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.critical} {displayedText.power}</Label>
                <InputFormField<WeaponDto> path='offense.critical.power' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.critical} {displayedText.range}</Label>
                <InputFormField<WeaponDto> path='offense.critical.range' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
            </div>
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='font-semibold text-base'>{displayedText.damageBonus}</Label>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.amount}</Label>
                <InputFormField<WeaponDto> path='damageBonus.amount' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.grade}</Label>
                <SelectFormField<WeaponDto> path='damageBonus.grade' labelText={displayedText.grade} items={allowedDiceGrades} />
              </div>
              <div className="grid auto-rows-min gap-2">
                <Label className='text-xs capitalize'>{displayedText.bonus}</Label>
                <InputFormField<WeaponDto> path='damageBonus.bonus' inputClassName='w-11 h-10 text-center font-medium' />
              </div>
            </div>
          </div>

        </div>

        <SheetFooter>
          <SubmitButton isPending={isPending} className="w-full" formName={formId} />
          <SheetClose className="capitalize" asChild>
            <Button variant="outline" type='button'>{displayedText.close}</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
