"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/shieldsClient";

import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Shield } from "@/domain/characters/equipment/Shield";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteShieldById } from '@/application/compendium/equipment/shields/hooks/useDeleteShieldById';
import { ShieldDto, shieldSchema } from "@/persistence/schemas/characters/equipment/shieldSchema";
import TagsView from "@/common/components/tags/TagsView";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";

type ShieldViewProps =
{
  shield: Shield;
  disableEdit?: boolean;
}

export default function ShieldView({ shield, disableEdit = false }: ShieldViewProps)
{
  const { deleteShield, isPending } = useDeleteShieldById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">

      <div className="p-2 rounded-md w-full">
        <div className="flex flex-row gap-2">
          <h4 className="font-semibold">{shield.name}</h4>
          <TagsView tags={shield.tags} />
        </div>
        <p className="text-sm text-muted-foreground">{shield.description}</p>
      </div>

      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.block}:</div>
          <div className="ml-1">{shield.block}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.resistance}:</div>
          <div className="ml-1">{shield.resistance}</div>
        </Badge>

        {
          !disableEdit && (
            <>
              <DeleteButton id={shield.id} isPending={isPending} deleteAction={deleteShield} />
              <EditShieldForm shield={shield} />
            </>
          )
        }
      </div>

    </div>
  );
}

type EditShieldFormProps =
{
  shield: Shield;
};

function EditShieldForm(input: EditShieldFormProps)
{
  const initialValues: ShieldDto = input.shield;

  const form = useForm<ShieldDto>
  ({
    resolver: zodResolver(shieldSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (shield: ShieldDto) => await client.update(input.shield.id, shield),
    {
      invalidateOnSuccess: ['shields'],
      toastPosition: "bottom-left"
    }
  );

  const formId = createCompendiumFormId.shield(input.shield.id);
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditShieldSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function EditShieldSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.edit} {displayedText.shields}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<ShieldDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<ShieldDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<ShieldDto> path='tags' />

          <div className="grid grid-cols-2 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.block}</Label>
              <InputFormField<ShieldDto> path='block' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.resistance}</Label>
              <InputFormField<ShieldDto> path='resistance' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.dexterityRestriction}</Label>
              <InputFormField<ShieldDto> path='dexterityRestriction' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.initiativeRestriction}</Label>
              <InputFormField<ShieldDto> path='initiativeRestriction' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.attributePenalty}</Label>
              <InputFormField<ShieldDto> path='attributePenalty' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='text-xs capitalize'>{displayedText.strengthRequirement}</Label>
              <InputFormField<ShieldDto> path='strengthRequirement' inputClassName='w-11 h-10 text-center font-medium' />
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
