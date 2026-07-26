"use client";

import client from "@/infrastructure/clients/perksClient";
import { type Perk } from "@/domain/characters/Perk";
import { displayedText } from '@/common/translations';
import PriceBadge from '@/common/components/badges/PriceBadge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { PerkDto, perkSchema } from "@/persistence/schemas/characters/perkSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import OwnedByCharacters from "@/application/common/OwnedByCharacters";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";

type PerkViewProps =
{
  perk: Perk;
  disableEdit?: boolean;
  onDelete?: (id: string) => void;
}

export default function PerkView({ perk, disableEdit = false, onDelete }: PerkViewProps)
{
  const { deleteEntity: deletePerk, isPending } = useDeleteEntity({
    client,
    queryKey: ['perks'],
    redirectPath: onDelete ? undefined : '/compendium/perks',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView>

      <SummaryView entity={perk} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={perk} />
      </div>

      <OwnedByCharacters entity="perks" id={perk.id} />

      <PerkableBadgeView>

        <PriceBadge price={perk.price} />
        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={perk.id} isPending={isPending} deleteAction={deletePerk} />
              
              <EditFormForSheet<PerkDto> 
                entityId={perk.id}
                defaultValues={{ ...perk, structuredRequirements: perk.structuredRequirements ?? [] }}
                schema={perkSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.perk(perk.id)}
                renderSheetContent=
                {
                  (isPending, formId) => (
                    <EditSheet
                      isPending={isPending}
                      formId={formId}
                      title={displayedText.editPerk}
                    >
                      <PerkEditableFields entityType="perks" />
                    </EditSheet>
                  )
                }
                cacheKeys={['perks']}
              />

            </CompendiumEditView>
          )
        }
      </PerkableBadgeView>

    </CompendiumView>
  );
}