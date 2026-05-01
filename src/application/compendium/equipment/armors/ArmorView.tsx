"use client";

import client from "@/infrastructure/clients/equipment/armorsClient";
import { type Armor } from "@/domain/characters/equipment/Armor";
import { displayedText } from '@/common/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ArmorDto, armorSchema } from "@/persistence/schemas/characters/equipment/armorSchema";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import ItemEditableFields from "@/application/common/equipment/EditSheets/ItemEditableFields";
import ArmorEditableFields from "@/application/common/equipment/EditSheets/ArmorEditableFields";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import ArmorViewFields from "@/application/common/equipment/Views/ArmorViewFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";

type ArmorViewProps =
{
  armor: Armor;
  disableEdit?: boolean;
  onDelete?: (id: string) => void;
}

export default function ArmorView({ armor, disableEdit = false, onDelete }: ArmorViewProps)
{
  const { deleteEntity: deleteArmor, isPending } = useDeleteEntity
  ({
    client,
    queryKey: ['armors'],
    redirectPath: onDelete ? undefined : '/compendium/equipment/armors',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView>

      <ArmorViewFields armor={armor} />

      {
        !disableEdit && (
          <CompendiumEditView>
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
                  <EditSheet title={displayedText.editingItem} isPending={isPending} formId={formId}>
                    <ItemEditableFields entityType="armors" />
                    <ArmorEditableFields />
                  </EditSheet>
                )
              }
              cacheKeys={['armors']}
            />

          </CompendiumEditView>
        )
      }

    </CompendiumView>
  );
}
