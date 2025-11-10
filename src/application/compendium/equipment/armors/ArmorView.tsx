"use client";

import client from "@/infrastructure/clients/equipment/armorsClient";
import { type Armor } from "@/domain/characters/equipment/Armor";
import { displayedText } from '@/presentation/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ArmorDto, armorSchema } from "@/persistence/schemas/characters/equipment/armorSchema";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { ItemEditSheet } from "@/application/common/equipment/EditSheets/ItemEditSheet";
import ArmorEditableFields from "@/application/common/equipment/EditSheets/ArmorEditableFields";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import ArmorViewFields from "@/application/common/equipment/Views/ArmorViewFields";

type ArmorViewProps =
{
  armor: Armor;
  disableEdit?: boolean;
}

export default function ArmorView({ armor, disableEdit = false }: ArmorViewProps)
{
  const { deleteEntity: deleteArmor, isPending } = useDeleteEntity({
    client,
    queryKey: ['armors'],
    redirectPath: '/compendium/equipment/armors'
  });

  return (
    <div className="flex flex-row items-center border rounded-md p-2 gap-2">

      <ArmorViewFields armor={armor} />

      {
        !disableEdit && (
          <>
            <DeleteButton id={armor.id} isPending={isPending} deleteAction={deleteArmor} />

            <EditFormForSheet<ArmorDto> 
              entityId={armor.id}
              defaultValues={armor}
              schema={armorSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.armor(armor.id)}
              renderSheetContent=
              {
                (isPending, formId) => (
                  <ItemEditSheet displayedTitle={displayedText.editingItem} isPending={isPending} formId={formId}>
                    <ArmorEditableFields />
                  </ItemEditSheet>
                )
              }
              cacheKeys={['armors']}
            />

          </>
        )
      }

    </div>
  );
}
