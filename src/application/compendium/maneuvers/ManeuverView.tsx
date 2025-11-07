"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/maneuversClient";

import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Maneuver } from "@/domain/characters/combat/Maneuver";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/presentation/translations';
import { battleIcon, cooldownIcon, editIcon, priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/presentation/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteManeuverById } from '@/application/compendium/maneuvers/hooks/useDeleteManeuverById';
import { ManeuverDto, maneuverSchema } from "@/persistence/schemas/characters/combat/maneuverSchema";
import TagsView from "@/common/components/TagsView";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import RequirementsView from "@/application/common/RequirementsView";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";

type ManeuverViewProps =
{
  maneuver: Maneuver;
}

export default function ManeuverView({ maneuver }: ManeuverViewProps)
{
  const { deleteManeuver, isPending } = useDeleteManeuverById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">


      <div className="p-2 rounded-md w-full">
        <div className="flex flex-row gap-2">
          <h4 className="font-semibold">{maneuver.name} {maneuver.grade}</h4>
          <TagsView tags={maneuver.tags} />
        </div>
          <p className="text-sm text-muted-foreground">{maneuver.description}</p>
      </div>

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={maneuver} />
      </div>
      
      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 w-10 capitalize">
          <div>{priceIcon}</div>
          <div>{maneuver.price}</div>
        </Badge>
        <Badge className='h-9 w-10 p-2 rounded-r-md pointer-events-none' variant={getBadgeVariant(maneuver.castTime)}>
            <div>{cooldownIcon()}</div>
            <div>{maneuver.cooldown || battleIcon("scale-90")}</div>
        </Badge>
        <DeleteButton id={maneuver.id} isPending={isPending} deleteAction={deleteManeuver} />
        <EditManeuverForm maneuver={maneuver} />
      </div>

    </div>
  );
}

type EditManeuverFormProps =
{
  maneuver: Maneuver;
};

function EditManeuverForm(input: EditManeuverFormProps)
{
  const initialValues: ManeuverDto = input.maneuver;

  const form = useForm<ManeuverDto>
  ({
    resolver: zodResolver(maneuverSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (maneuver: ManeuverDto) => await client.update(input.maneuver.id, maneuver),
    {
      invalidateOnSuccess: ['maneuvers'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `edit-maneuver-${input.maneuver.id}`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditManeuverSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function EditManeuverSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.editManeuver}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.name}</Label>
              <InputFormField<ManeuverDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<ManeuverDto> path='grade' inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<ManeuverDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<ManeuverDto> path='tags' />
          <FormStringsInput<ManeuverDto> path='requirements' placeholder={displayedText.addRequirement} />

          <div className="grid grid-cols-2 gap-4">

            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
              <InputFormField<ManeuverDto> path='cooldown' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.price}</Label>
              <InputFormField<ManeuverDto> path='price' inputClassName='w-11 h-10 text-center font-medium'  />
            </div>
          </div>
  
          <div className="flex flex-col items-center gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
            <SelectFormField<ManeuverDto> path='castTime' labelText={displayedText.castTime} items={allowedCastTimes} />
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