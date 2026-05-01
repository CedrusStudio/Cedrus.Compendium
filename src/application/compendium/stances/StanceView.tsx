"use client";

import client from "@/infrastructure/clients/stancesClient";
import { type Mode } from "@/domain/characters/combat/Mode";
import { displayedText } from '@/common/translations';
import PriceBadge from '@/common/components/badges/PriceBadge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ModeDto, modeSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";

type StanceViewProps =
{
  stance: Mode;
  disableEdit?: boolean;
  onDelete?: (id: string) => void;
}

export default function StanceView({ stance, disableEdit = false, onDelete }: StanceViewProps)
{
  const { deleteEntity: deleteStance, isPending } = useDeleteEntity({
    client,
    queryKey: ['stances'],
    redirectPath: onDelete ? undefined : '/compendium/stances',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView>

      <SummaryView entity={stance} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={stance} />
      </div>
      
      <PerkableBadgeView>

        <PriceBadge price={stance.price} />
        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={stance.id} isPending={isPending} deleteAction={deleteStance} />

              <EditFormForSheet<ModeDto> 
                entityId={stance.id}
                defaultValues={stance}
                schema={modeSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.stance(stance.id)}
                renderSheetContent=
                {
                  (isPending, formId) => (
                    <EditSheet
                      isPending={isPending}
                      formId={formId}
                      title={displayedText.editStance}
                    >
                      <PerkEditableFields entityType="stances" />
                    </EditSheet>
                  )
                }
                cacheKeys={['stances']}
              />

            </CompendiumEditView>
          )
        }
      </PerkableBadgeView>

    </CompendiumView>
  );
}