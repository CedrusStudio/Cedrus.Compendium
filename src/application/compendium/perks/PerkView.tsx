"use client";

import { CharacterMembershipAction } from '@/application/compendium/character-scope/CharacterMembershipAction';
import client from "@/infrastructure/clients/perksClient";
import { type Perk } from "@/domain/characters/Perk";
import { displayedText } from '@/common/translations';
import PriceBadge from '@/common/components/badges/PriceBadge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { PerkDto, perkSchema } from "@/persistence/schemas/characters/perkSchema";
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

type PerkViewProps =
{
  perk: Perk;
  disableEdit?: boolean;
  characterScope?: boolean;
  onDelete?: (id: string) => void;
}

export default function PerkView({ perk, disableEdit = false, characterScope = false, onDelete }: PerkViewProps)
{
  const { deleteEntity: deletePerk, isPending } = useDeleteEntity({
    client,
    queryKey: ['perks'],
    redirectPath: onDelete ? undefined : '/compendium/perks',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView characterActions={characterScope ? <CharacterMembershipAction kind="perks" entityId={perk.id} label={`${perk.name} ${perk.grade}`} /> : undefined}>

      <SummaryView entity={perk} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView useCompendiumCharacter={characterScope} entityWithRequirements={perk} />
      </div>

      <ReplacesView entity={perk} group="perks" />

      <OwnedByCharacters entity="perks" id={perk.id} />

      <PerkableBadgeView>

        <PriceBadge price={perk.price} />
        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={perk.id} isPending={isPending} deleteAction={deletePerk} />
              
              <EditFormForSheet<PerkDto> 
                entityId={perk.id}
                defaultValues={{ ...perk, structuredRequirements: perk.structuredRequirements ?? [], replaces: perk.replaces ?? [] }}
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
                      <ReplacesListField group="perks" />
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