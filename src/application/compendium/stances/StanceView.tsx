"use client";

import client from "@/infrastructure/clients/stancesClient";
import { type Mode } from "@/domain/characters/combat/Mode";
import { displayedText } from '@/common/translations';
import { Badge } from '@/common/components/ui/badge';
import PriceBadge from '@/common/components/badges/PriceBadge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ModeWithEffectsDto, modeWithEffectsSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import RequirementsView from "@/application/common/RequirementsView";
import ReplacesView from "@/application/common/ReplacesView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import { ManeuverEffectsEditableFields } from "@/application/combat-lab/effects-editor/ManeuverEffectsEditableFields";
import { describeManeuver } from "@/domain/combat-lab/effects/describeManeuver";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";
import OwnedByCharacters from "@/application/common/OwnedByCharacters";

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

      <ReplacesView entity={stance} />

      <ModeEffectsInfo mode={stance} />

      <OwnedByCharacters entity="stances" id={stance.id} />

      <PerkableBadgeView>

        <PriceBadge price={stance.price} />
        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={stance.id} isPending={isPending} deleteAction={deleteStance} />

              <EditFormForSheet<ModeWithEffectsDto>
                entityId={stance.id}
                defaultValues={{ ...stance, structuredRequirements: stance.structuredRequirements ?? [] }}
                schema={modeWithEffectsSchema}
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
                      <ManeuverEffectsEditableFields />
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

/** Read-only Combat Lab status of a stance/state: mapped / to-map / unsupported. */
function ModeEffectsInfo({ mode }: { mode: Mode })
{
  const effects = mode.effects ?? [];

  if (mode.simulatable === false)
  {
    return (
      <div className="w-full px-2 text-sm">
        <Badge variant="outline" className="border-amber-500 text-amber-600">Niesymulowalny</Badge>
        {mode.unsupportedReason && <span className="ml-2 text-muted-foreground">{mode.unsupportedReason}</span>}
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

  // Reuse the maneuver describer with a synthetic definition (a mode has no
  // castTime; supply a placeholder — only `effects` drive the description).
  const description = describeManeuver({ ...mode, effects, castTime: "Standardowa", hardRequirements: [], cost: { castTime: "Standardowa" } });

  return (
    <div className="w-full px-2 text-sm">
      <Badge variant="outline" className="border-emerald-500 text-emerald-600">Zmapowany · {effects.length} efekt(ów)</Badge>
      <div className="mt-1 text-muted-foreground">{description}</div>
    </div>
  );
}