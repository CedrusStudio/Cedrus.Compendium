"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/perksClient";

import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Perk } from "@/domain/characters/Perk";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { editIcon, priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeletePerkById } from '@/application/compendium/perks/hooks/useDeletePerkById';
import { PerkDto, perkSchema } from "@/persistence/schemas/characters/perkSchema";
import TagsView from "@/common/components/TagsView";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import RequirementsView from "@/application/common/RequirementsView";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";

type PerkViewProps =
{
  perk: Perk;
}

export default function PerkView({ perk }: PerkViewProps)
{
  const { deletePerk, isPending } = useDeletePerkById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">


      <div className="p-2 rounded-md w-full">
        <div className="flex flex-row gap-2">
          <h4 className="font-semibold">{perk.name} {perk.grade}</h4>
          <TagsView tags={perk.tags} />
        </div>
          <p className="text-sm text-muted-foreground">{perk.description}</p>
      </div>

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={perk} />
      </div>
      
      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 w-10 capitalize">
          <div>{priceIcon}</div>
          <div>{perk.price}</div>
        </Badge>
        <DeleteButton id={perk.id} isPending={isPending} deleteAction={deletePerk} />
        <EditPerkForm perk={perk} />
      </div>

    </div>
  );
}

type EditPerkFormProps =
{
  perk: Perk;
};

function EditPerkForm(input: EditPerkFormProps)
{
  const initialValues: PerkDto = input.perk;

  const form = useForm<PerkDto>
  ({
    resolver: zodResolver(perkSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (perk: PerkDto) => await client.update(input.perk.id, perk),
    {
      invalidateOnSuccess: ['perks'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `edit-perk-${input.perk.id}`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditPerkSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function EditPerkSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.editPerk}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<PerkDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<PerkDto> path='grade' inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<PerkDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<PerkDto> path='tags' />
          <FormStringsInput<PerkDto> path='requirements' placeholder={displayedText.addRequirement} />

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='justify-center capitalize'>{displayedText.price}</Label>
            <InputFormField<PerkDto> path='price' inputClassName='w-11 h-10 text-center font-medium'  />
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