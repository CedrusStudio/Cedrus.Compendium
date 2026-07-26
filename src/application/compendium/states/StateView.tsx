"use client";

import client from "@/infrastructure/clients/statesClient";
import { type Mode } from "@/domain/characters/combat/Mode";
import { displayedText } from '@/common/translations';
import PriceBadge from '@/common/components/badges/PriceBadge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ModeDto, modeSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import RequirementsView from "@/application/common/RequirementsView";
import ReplacesView from "@/application/common/ReplacesView";
import ReplacesListField from "@/application/common/replaces/ReplacesListField";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import OwnedByCharacters from "@/application/common/OwnedByCharacters";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";

type StateViewProps =
{
  state: Mode;
  disableEdit?: boolean;
  onDelete?: (id: string) => void;
}

export default function StateView({ state, disableEdit = false, onDelete }: StateViewProps)
{
  const { deleteEntity: deleteState, isPending } = useDeleteEntity({
    client,
    queryKey: ['states'],
    redirectPath: onDelete ? undefined : '/compendium/states',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView>

      <SummaryView entity={state} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={state} />
      </div>

      <ReplacesView entity={state} group="states" />

      <OwnedByCharacters entity="states" id={state.id} />

      <PerkableBadgeView>

        <PriceBadge price={state.price} />
        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={state.id} isPending={isPending} deleteAction={deleteState} />

              <EditFormForSheet<ModeDto> 
                entityId={state.id}
                defaultValues={{ ...state, structuredRequirements: state.structuredRequirements ?? [], replaces: state.replaces ?? [] }}
                schema={modeSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.state(state.id)}
                renderSheetContent=
                {
                  (isPending, formId) => (
                    <EditSheet
                      isPending={isPending}
                      formId={formId}
                      title={displayedText.editState}
                    >
                      <PerkEditableFields entityType="states" />
                      <ReplacesListField group="states" />
                    </EditSheet>
                  )
                }
                cacheKeys={['states']}
              />
            </CompendiumEditView>
          )
        }
      </PerkableBadgeView>

    </CompendiumView>
  );
}