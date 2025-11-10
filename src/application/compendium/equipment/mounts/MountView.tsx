"use client";

import client from "@/infrastructure/clients/equipment/mountsClient";
import { displayedText } from '@/presentation/translations';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { MountDto, mountSchema } from "@/persistence/schemas/characters/equipment/mountSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { ItemEditSheet } from "@/application/common/equipment/EditSheets/ItemEditSheet";
import MountEditableFields from "@/application/common/equipment/EditSheets/MountEditableFields";
import { Mount } from "@/domain/characters/equipment/Mount";

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
    <div className="flex flex-row items-center border rounded-md p-2">

      <SummaryView entity={mount} />

      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.pace}:</div>
          <div className="ml-1">{mount.paceSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.gallop}:</div>
          <div className="ml-1">{mount.gallopSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.canter}:</div>
          <div className="ml-1">{mount.canterSpeed}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.horsemanship}:</div>
          <div className="ml-1">{mount.horsemanshipBonus}</div>
        </Badge>

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

    </div>
  );
}
