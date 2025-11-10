"use client";

import client from "@/infrastructure/clients/equipment/shieldsClient";
import { type Shield } from "@/domain/characters/equipment/Shield";
import { displayedText } from '@/presentation/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ShieldDto, shieldSchema } from "@/persistence/schemas/characters/equipment/shieldSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import ShieldEditableFields from "@/application/common/equipment/EditSheets/ShieldEditableFields";
import { ItemEditSheet } from "@/application/common/equipment/EditSheets/ItemEditSheet";
import ShieldViewFields from "@/application/common/equipment/Views/ShieldViewFields";

type ShieldViewProps =
{
  shield: Shield;
  disableEdit?: boolean;
}

export default function ShieldView({ shield, disableEdit = false }: ShieldViewProps)
{
  const { deleteEntity: deleteShield, isPending } = useDeleteEntity({
    client,
    queryKey: ['shields'],
    redirectPath: '/compendium/equipment/shields'
  });

  return (
    <div className="flex flex-row items-center border rounded-md p-2 gap-2">

      <ShieldViewFields shield={shield} />

      {
        !disableEdit && (
          <>
            <DeleteButton id={shield.id} isPending={isPending} deleteAction={deleteShield} />

            <EditFormForSheet<ShieldDto> 
              entityId={shield.id}
              defaultValues={shield}
              schema={shieldSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.shield(shield.id)}
              renderSheetContent=
              {
                (isPending, formId) => (
                  <ItemEditSheet displayedTitle={displayedText.editingItem} isPending={isPending} formId={formId}>
                    <ShieldEditableFields />
                  </ItemEditSheet>
                )
              }
              cacheKeys={['shields']}
            />

          </>
        )
      }

    </div>
  );
}
