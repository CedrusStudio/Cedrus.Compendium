"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/stancesClient";

import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Mode } from "@/domain/characters/combat/Mode";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { editIcon, priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteStanceById } from '@/application/compendium/stances/hooks/useDeleteStanceById';
import { ModeDto, modeSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import TagsView from "@/common/components/tags/TagsView";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import RequirementsView from "@/application/common/RequirementsView";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";

type StanceViewProps =
{
  stance: Mode;
}

export default function StanceView({ stance }: StanceViewProps)
{
  const { deleteStance, isPending } = useDeleteStanceById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">


      <div className="p-2 rounded-md w-full">
        <div className="flex flex-row gap-2">
          <h4 className="font-semibold">{stance.name} {stance.grade}</h4>
          <TagsView tags={stance.tags} />
        </div>
          <p className="text-sm text-muted-foreground">{stance.description}</p>
      </div>

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={stance} />
      </div>
      
      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 w-10 capitalize">
          <div>{priceIcon}</div>
          <div>{stance.price}</div>
        </Badge>
        <DeleteButton id={stance.id} isPending={isPending} deleteAction={deleteStance} />
        <EditStanceForm stance={stance} />
      </div>

    </div>
  );
}

type EditStanceFormProps =
{
  stance: Mode;
};

function EditStanceForm(input: EditStanceFormProps)
{
  const initialValues: ModeDto = input.stance;

  const form = useForm<ModeDto>
  ({
    resolver: zodResolver(modeSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (stance: ModeDto) => await client.update(input.stance.id, stance),
    {
      invalidateOnSuccess: ['stances'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `edit-stance-${input.stance.id}`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditStanceSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function EditStanceSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.editStance}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<ModeDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<ModeDto> path='grade' inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<ModeDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<ModeDto> path='tags' />
          <FormStringsInput<ModeDto> path='requirements' placeholder={displayedText.addRequirement} />

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='justify-center capitalize'>{displayedText.price}</Label>
            <InputFormField<ModeDto> path='price' inputClassName='w-11 h-10 text-center font-medium'  />
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