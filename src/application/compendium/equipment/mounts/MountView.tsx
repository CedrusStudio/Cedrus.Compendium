"use client";

import client from "@/infrastructure/clients/equipment/mountsClient";
import { displayedText } from '@/presentation/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { MountDto, mountSchema } from "@/persistence/schemas/characters/equipment/mountSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { ItemEditSheet } from "@/application/common/equipment/EditSheets/ItemEditSheet";
import MountEditableFields from "@/application/common/equipment/EditSheets/MountEditableFields";
import { Mount } from "@/domain/characters/equipment/Mount";
import MountViewFields from "@/application/common/equipment/Views/MountViewFields";

type MountViewProps =
{
  mount: Mount;
  disableEdit?: boolean;
}

export default function MountView({ mount, disableEdit = false }: MountViewProps)
{
  const { deleteEntity: deleteMount, isPending } = useDeleteEntity({
    client,
    queryKey: ['mounts'],
    redirectPath: '/compendium/equipment/mounts'
  });

  return (
    <div className="flex flex-row items-center border rounded-md p-2 gap-2 sticky top-0 bg-background z-10">

      <MountViewFields mount={mount} />

      {
        !disableEdit && (
          <>
            <DeleteButton id={mount.id} isPending={isPending} deleteAction={deleteMount} />

            <EditFormForSheet<MountDto> 
              entityId={mount.id}
              defaultValues={mount}
              schema={mountSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.mount(mount.id)}
              renderSheetContent=
              {
                (isPending, formId) => (
                  <ItemEditSheet displayedTitle={displayedText.editingItem} isPending={isPending} formId={formId}>
                    <MountEditableFields />
                  </ItemEditSheet>
                )
              }
              cacheKeys={['mounts']}
            />

          </>
        )
      }

    </div>
  );
}
