"use client";

import client from "@/infrastructure/clients/perksClient";
import { type Perk } from "@/domain/characters/Perk";
import { displayedText } from '@/common/translations';
import { priceIcon } from '@/common/icons';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { PerkDto, perkSchema } from "@/persistence/schemas/characters/perkSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";

type PerkViewProps =
{
  perk: Perk;
  disableEdit?: boolean;
}

export default function PerkView({ perk, disableEdit = false }: PerkViewProps)
{
  const { deleteEntity: deletePerk, isPending } = useDeleteEntity({
    client,
    queryKey: ['perks'],
    redirectPath: '/compendium/perks'
  });

  return (
    <CompendiumView>

      <SummaryView entity={perk} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={perk} />
      </div>
      
      <PerkableBadgeView>

        <Badge variant="secondary" className="h-9 w-10 capitalize">
          <div>{priceIcon}</div>
          <div>{perk.price}</div>
        </Badge>
        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={perk.id} isPending={isPending} deleteAction={deletePerk} />
              
              <EditFormForSheet<PerkDto> 
                entityId={perk.id}
                defaultValues={perk}
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
                      <PerkEditableFields />
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