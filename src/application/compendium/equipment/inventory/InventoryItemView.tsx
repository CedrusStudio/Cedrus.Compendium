"use client";

import SubmitButton from "@/common/components/form/SubmitButton";
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
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";

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

      <SummaryView entity={item} />

      <div className="flex flex-row items-center gap-2">
      {
        !disableEdit && (
          <>
            <DeleteButton id={item.id} isPending={isPending} deleteAction={deleteInventoryItem} />

            <EditFormForSheet<InventoryItemDto> 
              entityId={item.id}
              defaultValues={item}
              schema={itemSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.inventoryItem(item.id)}
              renderSheetContent={(isPending, formId) => <EditInventoryItemSheet isPending={isPending} formId={formId} />}
              cacheKeys={['inventory']}
            />

          </>
        )
      }
      </div>

    </div>
  );
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
