"use client";

import client from "@/infrastructure/clients/equipment/armorsClient";
import { type Armor } from "@/domain/characters/equipment/Armor";
import { displayedText } from '@/presentation/translations';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ArmorDto, armorSchema } from "@/persistence/schemas/characters/equipment/armorSchema";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { ItemEditSheet } from "@/application/common/equipment/ItemEditSheet";
import ArmorEditableFields from "@/application/common/equipment/ArmorEditableFields";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";

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
    <div className="flex flex-row items-center border rounded-md p-2">

      <SummaryView entity={armor} />

      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.protection}:</div>
          <div className="ml-1">{armor.protection}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.immunity}:</div>
          <div className="ml-1">{armor.immunity}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.resistance}:</div>
          <div className="ml-1">{armor.resistance}</div>
        </Badge>

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

    </div>
  );
}
