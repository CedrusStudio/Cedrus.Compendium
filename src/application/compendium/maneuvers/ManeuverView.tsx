"use client";

import client from "@/infrastructure/clients/maneuversClient";
import { type Maneuver } from "@/domain/characters/combat/Maneuver";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/presentation/translations';
import { battleIcon, cooldownIcon, priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/presentation/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteManeuverById } from '@/application/compendium/maneuvers/hooks/useDeleteManeuverById';
import { ManeuverDto, maneuverSchema } from "@/persistence/schemas/characters/combat/maneuverSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { PerkableEditSheet } from "@/application/common/PerkableEditSheet";

type ManeuverViewProps =
{
  maneuver: Maneuver;
  disableEdit?: boolean;
}

export default function ManeuverView({ maneuver, disableEdit = false }: ManeuverViewProps)
{
  const { deleteManeuver, isPending } = useDeleteManeuverById();

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
                renderSheetContent={(isPending, formId) => <EditManeuverSheet isPending={isPending} formId={formId} />}
                cacheKeys={['maneuvers']}
              />

            </>
          )
        }
      </div>

    </div>
  );
}

function EditManeuverSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <PerkableEditSheet<ManeuverDto>
      isPending={isPending}
      formId={formId}
      displayedTitle={displayedText.editManeuver}
    >
      <div className="grid grid-cols-2 gap-4">

        <div className="grid auto-rows-min gap-3 px-4">
          <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
          <InputFormField<ManeuverDto> path='cooldown' inputClassName='w-11 h-10 text-center font-medium' />
        </div>

        <div className="flex flex-col items-center gap-3 px-4">
          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
          <SelectFormField<ManeuverDto> path='castTime' labelText={displayedText.castTime} items={allowedCastTimes} />
        </div>

      </div>
    </PerkableEditSheet>
  )
}