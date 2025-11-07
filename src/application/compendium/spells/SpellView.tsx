"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/spellsClient";

import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Spell } from "@/domain/characters/combat/Power";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/presentation/translations';
import { battleIcon, cooldownIcon, costIcon, editIcon, priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/presentation/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteSpellById } from '@/application/compendium/spells/hooks/useDeleteSpellById';
import { SpellDto, spellSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import TagsView from "@/common/components/TagsView";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import RequirementsView from "@/application/common/RequirementsView";
import FormStringsInput from "@/common/components/inputs/FormStringsInput";

type SpellViewProps =
{
  spell: Spell;
}

export default function SpellView({ spell }: SpellViewProps)
{
  const { deleteSpell, isPending } = useDeleteSpellById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">


      <div className="p-2 rounded-md w-full">
        <div className="flex flex-row gap-2">
          <h4 className="font-semibold">{spell.name} {spell.grade}</h4>
          <TagsView tags={spell.tags} />
        </div>
          <p className="text-sm text-muted-foreground">{spell.description}</p>
      </div>

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={spell} />
      </div>
      
      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 w-10 capitalize">
          <div>{priceIcon}</div>
          <div>{spell.price}</div>
        </Badge>

        <Badge variant="cost" className="h-9 w-14 capitalize ">
          <div>{costIcon}</div>
          <div>{spell.cost}</div>
        </Badge>
        <Badge className='h-9 w-10 p-2 rounded-r-md pointer-events-none' variant={getBadgeVariant(spell.castTime)}>
            <div>{cooldownIcon()}</div>
            <div>{spell.cooldown || battleIcon("scale-90")}</div>
        </Badge>
        <DeleteButton id={spell.id} isPending={isPending} deleteAction={deleteSpell} />
        <EditSpellForm spell={spell} />
      </div>

    </div>
  );
}

type EditSpellFormProps =
{
  spell: Spell;
};

function EditSpellForm(input: EditSpellFormProps)
{
  const initialValues: SpellDto = input.spell;

  const form = useForm<SpellDto>
  ({
    resolver: zodResolver(spellSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (spell: SpellDto) => await client.update(input.spell.id, spell),
    {
      invalidateOnSuccess: ['spells'],
      toastPosition: "bottom-left"
    }
  );

  const formId = `edit-spell-${input.spell.id}`;
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditSpellSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function EditSpellSheet({ isPending, formId }: { isPending: boolean, formId: string })
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
              <InputFormField<SpellDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='capitalize'>{displayedText.grade}</Label>
              <InputFormField<SpellDto> path='grade' inputClassName="w-11 h-10 text-center font-medium" />
            </div>

          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<SpellDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<SpellDto> path='tags' />
          <FormStringsInput<SpellDto> path='requirements' placeholder={displayedText.addRequirement} />

          <div className="grid grid-cols-3 gap-4">
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
              <InputFormField<SpellDto> path='cooldown' inputClassName='w-11 h-10 text-center font-medium' />
            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.cost}</Label>
              <InputFormField<SpellDto> path='cost' inputClassName='w-14 h-10 text-center font-medium'  />
            </div>
    
            <div className="grid auto-rows-min gap-3 px-4">
              <Label className='justify-center capitalize'>{displayedText.price}</Label>
              <InputFormField<SpellDto> path='price' inputClassName='w-11 h-10 text-center font-medium'  />
            </div>
          </div>
  
          <div className="flex flex-col items-center gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
            <SelectFormField<SpellDto> path='castTime' labelText={displayedText.castTime} items={allowedCastTimes} />
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