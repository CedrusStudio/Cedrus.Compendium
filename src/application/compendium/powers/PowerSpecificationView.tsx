"use client";

import client from "@/infrastructure/clients/spellsClient";
import { type PowerSpecification } from "@/domain/characters/combat/Power";
import { displayedText } from '@/presentation/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { SpellDto, spellSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { PerkableEditSheet } from "@/application/common/PerkableEditSheet";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PowerSpecificationEditableFields from "@/application/common/combat/PowerSpecificationEditableFields";
import PowerSpecificationViewFields from "@/application/common/combat/PowerSpecificationViewFields";

type PowersSpecificationViewProps =
{
  powerSpecification: PowerSpecification;
  disableEdit?: boolean;
}

export default function PowersSpecificationView({ powerSpecification, disableEdit = false }: PowersSpecificationViewProps)
{
  const { deleteEntity: deletePowerSpecification, isPending } = useDeleteEntity({
    client,
    queryKey: ['powerSpecifications'],
    redirectPath: '/compendium/powers'
  });

  return (
    <CompendiumView>

      <p className="font-semibold">{powerSpecification.name}</p>

      <PowerSpecificationViewFields powerSpecification={powerSpecification} />
      
      {
        !disableEdit && (
          <CompendiumEditView>
            <DeleteButton id={powerSpecification.id} isPending={isPending} deleteAction={deletePowerSpecification} />

            <EditFormForSheet<SpellDto> 
              entityId={powerSpecification.id}
              defaultValues={powerSpecification}
              schema={spellSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.spell(powerSpecification.id)}
              renderSheetContent=
              {
                (isPending, formId) => <EditPowerSpecificationSheet isPending={isPending} formId={formId} />
              }
              cacheKeys={['powerSpecifications']}
            />

          </CompendiumEditView>
        )
      }

    </CompendiumView>
  );
}

function EditPowerSpecificationSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <PerkableEditSheet
      isPending={isPending}
      formId={formId}
      displayedTitle={displayedText.editSpell}
    >
      <PowerSpecificationEditableFields  />
    </PerkableEditSheet>
  )
}