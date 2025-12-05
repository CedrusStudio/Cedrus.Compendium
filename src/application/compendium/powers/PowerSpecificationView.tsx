"use client";

import client from "@/infrastructure/clients/powerSpecificationsClient";
import { type PowerSpecification } from "@/domain/characters/combat/Power";
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { PowerSpecificationDto, powerSpecificationSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PowerSpecificationEditableFields from "@/application/common/combat/PowerSpecificationEditableFields";
import PowerSpecificationViewFields from "@/application/common/combat/PowerSpecificationViewFields";
import { EditSheet } from "@/common/components/sheets/EditSheet";

type PowersSpecificationViewProps =
{
  powerSpecification: PowerSpecification;
  disableEdit?: boolean;
}

export default function PowersSpecificationView({ powerSpecification, disableEdit = false }: PowersSpecificationViewProps)
{
  const { deleteEntity: deletePowerSpecification, isPending } = useDeleteEntity
  ({
    client,
    queryKey: ['powerSpecifications'],
    redirectPath: '/compendium/powers'
  });

  return (
    <CompendiumView>

      <PowerSpecificationViewFields powerSpecification={powerSpecification} collapsible={true} defaultOpen={false} />
      
      {
        !disableEdit && (
          <CompendiumEditView>
            <DeleteButton id={powerSpecification.id} isPending={isPending} deleteAction={deletePowerSpecification} />

            <EditFormForSheet<PowerSpecificationDto> 
              entityId={powerSpecification.id}
              defaultValues={powerSpecification}
              schema={powerSpecificationSchema}
              updateFn={client.update}
              formId={createCompendiumFormId.spell(powerSpecification.id)}
              renderSheetContent=
              {
                (isPending, formId) => (
                  <EditSheet
                    isPending={isPending}
                    formId={formId}
                    title="Edycja specyfikacji mocy"
                  >
                    <PowerSpecificationEditableFields />
                  </EditSheet>
                )
              }
              cacheKeys={['powerSpecifications']}
            />

          </CompendiumEditView>
        )
      }

    </CompendiumView>
  );
}