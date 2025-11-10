"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
import client from "@/infrastructure/clients/equipment/mountsClient";
import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Mount } from "@/domain/characters/equipment/Mount";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteMountById } from '@/application/compendium/equipment/mounts/hooks/useDeleteMountById';
import { MountDto, mountSchema } from "@/persistence/schemas/characters/equipment/mountSchema";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";

type MountViewProps =
{
  mount: Mount;
  disableEdit?: boolean;
}

export default function MountView({ mount, disableEdit = false }: MountViewProps)
{
  const { deleteMount, isPending } = useDeleteMountById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">

      <SummaryView entity={mount} />

      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.pace}:</div>
          <div className="ml-1">{mount.paceSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.gallop}:</div>
          <div className="ml-1">{mount.gallopSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.canter}:</div>
          <div className="ml-1">{mount.canterSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.horsemanship}:</div>
          <div className="ml-1">{mount.horsemanshipBonus}</div>
        </Badge>

        {
          !disableEdit && (
            <>
              <DeleteButton id={mount.id} isPending={isPending} deleteAction={deleteMount} />

              <EditFormForSheet<MountDto> 
                entityId={mount.id}
                defaultValues={mount}
                schema={mountSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.mount(mount.id)}
                renderSheetContent={(isPending, formId) => <EditMountSheet isPending={isPending} formId={formId} />}
                cacheKeys={['mounts']}
              />

            </>
          )
        }
      </div>

    </div>
  );
}

function EditMountSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.edit} {displayedText.mounts}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<MountDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<MountDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<MountDto> path='tags' />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.paceSpeed}</Label>
              <InputFormField<MountDto> path='paceSpeed' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.gallopSpeed}</Label>
              <InputFormField<MountDto> path='gallopSpeed' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.canterSpeed}</Label>
              <InputFormField<MountDto> path='canterSpeed' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.horsemanshipBonus}</Label>
              <InputFormField<MountDto> path='horsemanshipBonus' inputClassName='w-11 h-10 text-center font-medium' />
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
