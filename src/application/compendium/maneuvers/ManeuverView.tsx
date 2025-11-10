"use client";

import client from "@/infrastructure/clients/maneuversClient";
import { type Maneuver } from "@/domain/characters/combat/Maneuver";
import { displayedText } from '@/presentation/translations';
import { battleIcon, cooldownIcon, priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/presentation/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ManeuverDto, maneuverSchema } from "@/persistence/schemas/characters/combat/maneuverSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { PerkableEditSheet } from "@/application/common/PerkableEditSheet";
import CastablePerkEditableFields from "@/application/common/combat/CastablePerkEditableFields";

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
    <div className="flex flex-row items-center border rounded-md p-2">

      <SummaryView entity={maneuver} />
      
      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={maneuver} />
      </div>
      
      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 w-10 capitalize">
          <div>{priceIcon}</div>
          <div>{maneuver.price}</div>
        </Badge>
        <Badge className='h-9 w-10 p-2 rounded-r-md pointer-events-none' variant={getBadgeVariant(maneuver.castTime)}>
            <div>{cooldownIcon()}</div>
            <div>{maneuver.cooldown || battleIcon("scale-90")}</div>
        </Badge>


        {
          !disableEdit && (
            <>
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
                    <PerkableEditSheet
                      isPending={isPending}
                      formId={formId}
                      displayedTitle={displayedText.editManeuver}
                    >
                      <CastablePerkEditableFields />
                    </PerkableEditSheet>
                  )
                }
                cacheKeys={['maneuvers']}
              />

            </>
          )
        }
      </div>

    </div>
  );
}