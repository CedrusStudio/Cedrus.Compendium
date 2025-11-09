"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
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
import TagsView from "@/common/components/tags/TagsView";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";

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

      <div className="p-2 rounded-md w-full">
        <div className="flex flex-row gap-2">
          <h4 className="font-semibold">{mount.name}</h4>
          <TagsView tags={mount.tags} />
        </div>
        <p className="text-sm text-muted-foreground">{mount.description}</p>
      </div>

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
              <EditMountForm mount={mount} />
            </>
          )
        }
      </div>

    </div>
  );
}

type EditMountFormProps =
{
  mount: Mount;
};

function EditMountForm(input: EditMountFormProps)
{
  const initialValues: MountDto = input.mount;

  const form = useForm<MountDto>
  ({
    resolver: zodResolver(mountSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (mount: MountDto) => await client.update(input.mount.id, mount),
    {
      invalidateOnSuccess: ['mounts'],
      toastPosition: "bottom-left"
    }
  );

  const formId = createCompendiumFormId.mount(input.mount.id);
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditMountSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
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
