"use client";

import client from "@/infrastructure/clients/equipment/shieldsClient";
import { type Shield } from "@/domain/characters/equipment/Shield";
import { displayedText } from '@/common/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ShieldDto, shieldSchema } from "@/persistence/schemas/characters/equipment/shieldSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import ShieldEditableFields from "@/application/common/equipment/EditSheets/ShieldEditableFields";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import ItemEditableFields from "@/application/common/equipment/EditSheets/ItemEditableFields";
import ShieldViewFields from "@/application/common/equipment/Views/ShieldViewFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";

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
    <CompendiumView>

      <ShieldViewFields shield={shield} />

      {
        !disableEdit && (
          <CompendiumEditView>
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
                  <EditSheet title={displayedText.editingItem} isPending={isPending} formId={formId}>
                    <ItemEditableFields />
                    <ShieldEditableFields />
                  </EditSheet>
                )
              }
              cacheKeys={['shields']}
            />

          </CompendiumEditView>
        )
      }

    </CompendiumView>
  );
}
