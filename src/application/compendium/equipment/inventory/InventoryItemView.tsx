"use client";

import client from "@/infrastructure/clients/equipment/inventoryClient";
import { type Item } from "@/domain/characters/equipment/Item";
import { displayedText } from '@/presentation/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { InventoryItemDto, itemSchema } from "@/persistence/schemas/characters/equipment/itemSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { ItemEditSheet } from "@/application/common/equipment/EditSheets/ItemEditSheet";
import InventoryItemViewFields from "@/application/common/equipment/Views/InventoryItemViewFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";

type InventoryItemViewProps =
{
  item: Item;
  disableEdit?: boolean;
}

export default function InventoryItemView({ item, disableEdit = false }: InventoryItemViewProps)
{
  const { deleteEntity: deleteInventoryItem, isPending } = useDeleteEntity({
    client,
    queryKey: ['inventory'],
    redirectPath: '/compendium/equipment/inventory'
  });

  return (
    <CompendiumView>

      <InventoryItemViewFields item={item} />

      {
        !disableEdit && (
          <CompendiumEditView>
            <DeleteButton id={item.id} isPending={isPending} deleteAction={deleteInventoryItem} />

            <EditFormForSheet<InventoryItemDto> 
              entityId={item.id}
              defaultValues={item}
              schema={itemSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.inventoryItem(item.id)}
              renderSheetContent=
              {
                (isPending, formId) => <ItemEditSheet displayedTitle={displayedText.editingItem} isPending={isPending} formId={formId} />
              }
              cacheKeys={['inventory']}
            />

          </CompendiumEditView>
        )
      }

    </CompendiumView>
  );
}
