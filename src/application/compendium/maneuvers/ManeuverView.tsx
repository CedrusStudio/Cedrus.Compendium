"use client";

import client from "@/infrastructure/clients/maneuversClient";
import { type Maneuver } from "@/domain/characters/combat/Maneuver";
import { displayedText } from '@/common/translations';
import { battleIcon, cooldownIcon } from '@/common/icons';
import { Badge } from '@/common/components/ui/badge';
import PriceBadge from '@/common/components/badges/PriceBadge';
import { getBadgeVariant } from '@/common/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ManeuverDto, maneuverSchema } from "@/persistence/schemas/characters/combat/maneuverSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import CastablePerkEditableFields from "@/application/common/combat/CastablePerkEditableFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";

type ManeuverViewProps =
{
  maneuver: Maneuver;
  disableEdit?: boolean;
}

export default function ManeuverView({ maneuver, disableEdit = false }: ManeuverViewProps)
{
  const { deleteEntity: deleteManeuver, isPending } = useDeleteEntity({
    client,
    queryKey: ['maneuvers'],
    redirectPath: '/compendium/maneuvers'
  });

  return (
    <CompendiumView>

      <SummaryView entity={maneuver} />
      
      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={maneuver} />
      </div>
      
      <PerkableBadgeView>

        <PriceBadge price={maneuver.price} />
        
        <Badge className='h-9 w-10 p-2 rounded-r-md pointer-events-none' variant={getBadgeVariant(maneuver.castTime)}>
            <div>{cooldownIcon()}</div>
            <div>{maneuver.cooldown || battleIcon("scale-90")}</div>
        </Badge>

        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={maneuver.id} isPending={isPending} deleteAction={deleteManeuver} />

              <EditFormForSheet<ManeuverDto> 
                entityId={maneuver.id}
                defaultValues={maneuver}
                schema={maneuverSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.maneuver(maneuver.id)}
                renderSheetContent=
                {
                  (isPending, formId) => (
                    <EditSheet
                      isPending={isPending}
                      formId={formId}
                      title={displayedText.editManeuver}
                    >
                      <PerkEditableFields />
                      <CastablePerkEditableFields />
                    </EditSheet>
                  )
                }
                cacheKeys={['maneuvers']}
              />

            </CompendiumEditView>
          )
        }
      </PerkableBadgeView>

    </CompendiumView>
  );
}