"use client";

import { CharacterMembershipAction } from '@/application/compendium/character-scope/CharacterMembershipAction';
import client from "@/infrastructure/clients/equipment/mountsClient";
import { displayedText } from '@/common/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { MountDto, mountSchema } from "@/persistence/schemas/characters/equipment/mountSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import ItemEditableFields from "@/application/common/equipment/EditSheets/ItemEditableFields";
import MountEditableFields from "@/application/common/equipment/EditSheets/MountEditableFields";
import { Mount } from "@/domain/characters/equipment/Mount";
import MountViewFields from "@/application/common/equipment/Views/MountViewFields";
import OwnedByCharacters from "@/application/common/OwnedByCharacters";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";

type MountViewProps =
{
  mount: Mount;
  disableEdit?: boolean;
  characterScope?: boolean;
  onDelete?: (id: string) => void;
}

export default function MountView({ mount, disableEdit = false, characterScope = false, onDelete }: MountViewProps)
{
  const { deleteEntity: deleteMount, isPending } = useDeleteEntity({
    client,
    queryKey: ['mounts'],
    redirectPath: onDelete ? undefined : '/compendium/equipment/mounts',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView characterActions={characterScope ? <CharacterMembershipAction kind="mounts" entityId={mount.id} label={mount.name} /> : undefined}>

      <MountViewFields mount={mount} />

      <OwnedByCharacters entity="mounts" id={mount.id} />

      {
        !disableEdit && (
          <CompendiumEditView>
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
                  <EditSheet title={displayedText.editingItem} isPending={isPending} formId={formId}>
                    <ItemEditableFields entityType="mounts" />
                    <MountEditableFields />
                  </EditSheet>
                )
              }
              cacheKeys={['mounts']}
            />

          </CompendiumEditView>
        )
      }

    </CompendiumView>
  );
}
