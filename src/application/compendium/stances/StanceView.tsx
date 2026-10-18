"use client";

import { CharacterMembershipAction } from '@/application/compendium/character-scope/CharacterMembershipAction';
import client from "@/infrastructure/clients/stancesClient";
import { type Mode } from "@/domain/characters/combat/Mode";
import { displayedText } from '@/common/translations';
import PriceBadge from '@/common/components/badges/PriceBadge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { ModeWithEffectsDto, modeWithEffectsSchema } from "@/persistence/schemas/characters/combat/modeSchema";
import RequirementsView from "@/application/common/RequirementsView";
import ReplacesView from "@/application/common/ReplacesView";
import ReplacesListField from "@/application/common/replaces/ReplacesListField";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import { ManeuverEffectsEditableFields } from "@/application/combat-lab/effects-editor/ManeuverEffectsEditableFields";
import ModeEffectsInfo from "@/application/compendium/ModeEffectsInfo";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";
import OwnedByCharacters from "@/application/common/OwnedByCharacters";

type StanceViewProps =
{
  stance: Mode;
  disableEdit?: boolean;
  characterScope?: boolean;
  onDelete?: (id: string) => void;
}

export default function StanceView({ stance, disableEdit = false, characterScope = false, onDelete }: StanceViewProps)
{
  const { deleteEntity: deleteStance, isPending } = useDeleteEntity({
    client,
    queryKey: ['stances'],
    redirectPath: onDelete ? undefined : '/compendium/stances',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView characterActions={characterScope ? <CharacterMembershipAction kind="stances" entityId={stance.id} label={`${stance.name} ${stance.grade}`} /> : undefined}>

      <SummaryView entity={stance} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView useCompendiumCharacter={characterScope} entityWithRequirements={stance} />
      </div>

      <ReplacesView entity={stance} group="stances" />

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
                defaultValues={{ ...stance, structuredRequirements: stance.structuredRequirements ?? [], replaces: stance.replaces ?? [] }}
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
                      <ReplacesListField group="stances" />
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