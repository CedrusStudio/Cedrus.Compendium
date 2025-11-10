"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import client from "@/infrastructure/clients/equipment/armorsClient";
import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Armor } from "@/domain/characters/equipment/Armor";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteArmorById } from '@/application/compendium/equipment/armors/hooks/useDeleteArmorById';
import { ArmorDto, armorSchema } from "@/persistence/schemas/characters/equipment/armorSchema";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";

type ArmorViewProps =
{
  armor: Armor;
  disableEdit?: boolean;
}

export default function ArmorView({ armor, disableEdit = false }: ArmorViewProps)
{
  const { deleteArmor, isPending } = useDeleteArmorById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">

      <SummaryView entity={armor} />

      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.protection}:</div>
          <div className="ml-1">{armor.protection}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.immunity}:</div>
          <div className="ml-1">{armor.immunity}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.resistance}:</div>
          <div className="ml-1">{armor.resistance}</div>
        </Badge>

        {
          !disableEdit && (
            <>
              <DeleteButton id={armor.id} isPending={isPending} deleteAction={deleteArmor} />

              <EditFormForSheet<ArmorDto> 
                entityId={armor.id}
                defaultValues={armor}
                schema={armorSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.armor(armor.id)}
                renderSheetContent={(isPending, formId) => <EditArmorSheet isPending={isPending} formId={formId} />}
                cacheKeys={['armors']}
              />

            </>
          )
        }
      </div>

    </div>
  );
}

function EditArmorSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.edit} {displayedText.armor}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<ArmorDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<ArmorDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<ArmorDto> path='tags' />

          <div className="grid grid-cols-3 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.protection}</Label>
              <InputFormField<ArmorDto> path='protection' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.immunity}</Label>
              <InputFormField<ArmorDto> path='immunity' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.resistance}</Label>
              <InputFormField<ArmorDto> path='resistance' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.dexterityRestriction}</Label>
              <InputFormField<ArmorDto> path='dexterityRestriction' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.initiativeRestriction}</Label>
              <InputFormField<ArmorDto> path='initiativeRestriction' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.attributePenalty}</Label>
              <InputFormField<ArmorDto> path='attributePenalty' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.strengthRequirement}</Label>
              <InputFormField<ArmorDto> path='strengthRequirement' inputClassName='w-11 h-10 text-center font-medium' />
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
