"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import SubmitButton from "@/common/components/form/SubmitButton";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import client from "@/infrastructure/clients/equipment/inventoryClient";

import { Button } from '@/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/ui/sheet";
import { type Item } from "@/domain/characters/equipment/Item";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { displayedText } from '@/presentation/translations';
import { editIcon } from '@/presentation/icons';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteInventoryItemById } from '@/application/compendium/equipment/inventory/hooks/useDeleteInventoryItemById';
import { InventoryItemDto, itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";
import TagsView from "@/common/components/tags/TagsView";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";

type InventoryItemViewProps =
{
  item: Item;
  disableEdit?: boolean;
}

export default function InventoryItemView({ item, disableEdit = false }: InventoryItemViewProps)
{
  const { deleteInventoryItem, isPending } = useDeleteInventoryItemById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">

      <div className="p-2 rounded-md w-full">
        <div className="flex flex-row gap-2">
          <h4 className="font-semibold">{item.name}</h4>
          <TagsView tags={item.tags} />
        </div>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>

      <div className="flex flex-row items-center gap-2">
        {
          !disableEdit && (
            <>
              <DeleteButton id={item.id} isPending={isPending} deleteAction={deleteInventoryItem} />
              <EditInventoryItemForm item={item} />
            </>
          )
        }
      </div>

    </div>
  );
}

type EditInventoryItemFormProps =
{
  item: Item;
};

function EditInventoryItemForm(input: EditInventoryItemFormProps)
{
  const initialValues: InventoryItemDto = input.item;

  const form = useForm<InventoryItemDto>
  ({
    resolver: zodResolver(itemSchema),
    defaultValues: initialValues,
    mode: "onBlur"
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (item: InventoryItemDto) => await client.update(input.item.id, item),
    {
      invalidateOnSuccess: ['inventory'],
      toastPosition: "bottom-left"
    }
  );

  const formId = createCompendiumFormId.inventoryItem(input.item.id);
  
  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditInventoryItemSheet isPending={isPending} formId={formId} />
      </form>
    </Form>
  )
}

function EditInventoryItemSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <Sheet>

      <SheetTrigger asChild>
        <Button variant="outline" size='icon' type="button">{editIcon}</Button>
      </SheetTrigger>

      <SheetContent>
        
        <SheetHeader>
          <SheetTitle className='first-letter:uppercase'>{displayedText.edit} {displayedText.inventory}</SheetTitle>
          <SheetDescription>
           {displayedText.clickSave}
          </SheetDescription>
        </SheetHeader>

        <div className="grid auto-rows-min gap-3 px-4">

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.name}</Label>
            <InputFormField<InventoryItemDto> path='name' inputPlaceholder={displayedText.changeName} inputClassName='w-60' />
          </div>

          <div className="grid auto-rows-min gap-3 px-4">
            <Label className='capitalize'>{displayedText.description}</Label>
            <AreaInputFormField<InventoryItemDto> path='description' inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' />
          </div>

          <FormTagsInput<InventoryItemDto> path='tags' />

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
