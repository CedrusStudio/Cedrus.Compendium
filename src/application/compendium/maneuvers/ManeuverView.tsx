"use client";

import client from "@/infrastructure/clients/maneuversClient";
import { type Maneuver } from "@/domain/characters/combat/Maneuver";
import { toManeuverDefinition } from "@/domain/combat-lab/effects/ManeuverDefinition";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";
import { displayedText } from '@/common/translations';
import { battleIcon, cooldownIcon } from '@/common/icons';
import { Badge } from '@/common/components/ui/badge';
import PriceBadge from '@/common/components/badges/PriceBadge';
import { getBadgeVariant } from '@/common/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ManeuverWithEffectsDto, maneuverWithEffectsSchema } from "@/persistence/schemas/characters/combat/maneuverSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import CastablePerkEditableFields from "@/application/common/combat/CastablePerkEditableFields";
import { ManeuverEffectsEditableFields } from "@/application/combat-lab/effects-editor/ManeuverEffectsEditableFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";
import OwnedByCharacters from "@/application/common/OwnedByCharacters";

type ManeuverViewProps =
{
  maneuver: Maneuver;
  disableEdit?: boolean;
  onDelete?: (id: string) => void;
}

export default function ManeuverView({ maneuver, disableEdit = false, onDelete }: ManeuverViewProps)
{
  const { deleteEntity: deleteManeuver, isPending } = useDeleteEntity({
    client,
    queryKey: ['maneuvers'],
    redirectPath: onDelete ? undefined : '/compendium/maneuvers',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView>

      <SummaryView entity={maneuver} />
      
      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={maneuver} />
      </div>

      <ManeuverEffectsInfo maneuver={maneuver} />

      <OwnedByCharacters entity="maneuvers" id={maneuver.id} />

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

              <EditFormForSheet<ManeuverWithEffectsDto>
                entityId={maneuver.id}
                defaultValues={{ ...maneuver, structuredRequirements: maneuver.structuredRequirements ?? [] }}
                schema={maneuverWithEffectsSchema}
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
                      <PerkEditableFields entityType="maneuvers" />
                      <CastablePerkEditableFields />
                      <ManeuverEffectsEditableFields />
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

/** Read-only Combat Lab status of a maneuver: mapped / to-map / not simulatable. */
function ManeuverEffectsInfo({ maneuver }: { maneuver: Maneuver })
{
  const effects = maneuver.effects ?? [];

  if (maneuver.simulatable === false)
  {
    return (
      <div className="w-full px-2 text-sm">
        <Badge variant="outline" className="border-amber-500 text-amber-600">Niesymulowalny</Badge>
        {maneuver.unsupportedReason && <span className="ml-2 text-muted-foreground">{maneuver.unsupportedReason}</span>}
      </div>
    );
  }

  if (effects.length === 0)
  {
    return (
      <div className="w-full px-2 text-sm text-muted-foreground">
        Efekty: <span className="text-foreground">do zmapowania</span>
      </div>
    );
  }

  return (
    <div className="w-full px-2 text-sm">
      <Badge variant="outline" className="border-emerald-500 text-emerald-600">Zmapowany · {effects.length} efekt(ów)</Badge>
      <div className="mt-1 text-muted-foreground">{describeManeuver(toManeuverDefinition(maneuver))}</div>
    </div>
  );
}