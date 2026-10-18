"use client";

import { CharacterMembershipAction } from '@/application/compendium/character-scope/CharacterMembershipAction';
import client from "@/infrastructure/clients/spellsClient";
import { type Spell } from "@/domain/characters/combat/Power";
import { formatSpellCost } from '@/domain/characters/combat/SpellCost';
import { displayedText } from '@/common/translations';
import { battleIcon, cooldownIcon, costIcon } from '@/common/icons';
import { Badge } from '@/common/components/ui/badge';
import PriceBadge from '@/common/components/badges/PriceBadge';
import { getBadgeVariant } from '@/common/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { SpellDto, spellSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import RequirementsView from "@/application/common/RequirementsView";
import ReplacesView from "@/application/common/ReplacesView";
import ReplacesListField from "@/application/common/replaces/ReplacesListField";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import SpellEditableFields from "@/application/common/combat/SpellEditableFields";
import OwnedByCharacters from "@/application/common/OwnedByCharacters";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";

type SpellViewProps =
{
  spell: Spell;
  disableEdit?: boolean;
  characterScope?: boolean;
  onDelete?: (id: string) => void;
}

export default function SpellView({ spell, disableEdit = false, characterScope = false, onDelete }: SpellViewProps)
{
  const { deleteEntity: deleteSpell, isPending } = useDeleteEntity({
    client,
    queryKey: ['spells'],
    redirectPath: onDelete ? undefined : '/compendium/spells',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView characterActions={characterScope ? <CharacterMembershipAction kind="spells" entityId={spell.id} label={`${spell.name} ${spell.grade}`} /> : undefined}>

      <SummaryView entity={spell} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView useCompendiumCharacter={characterScope} entityWithRequirements={spell} />
      </div>

      <ReplacesView entity={spell} group="spells" />

      <OwnedByCharacters entity="spells" id={spell.id} />

      <PerkableBadgeView>

        <PriceBadge price={spell.price} />

        <Badge variant="cost" className="min-h-9 max-w-full px-2 capitalize">
          <div>{costIcon}</div>
          <div>{formatSpellCost(spell.cost)}</div>
        </Badge>
        <Badge className='h-9 w-10 p-2 rounded-r-md pointer-events-none' variant={getBadgeVariant(spell.castTime)}>
            <div>{cooldownIcon()}</div>
            <div>{spell.cooldown || battleIcon("scale-90")}</div>
        </Badge>
        {
          !disableEdit && (
            <CompendiumEditView>
              <DeleteButton id={spell.id} isPending={isPending} deleteAction={deleteSpell} />

              <EditFormForSheet<SpellDto> 
                entityId={spell.id}
                defaultValues={{ ...spell, structuredRequirements: spell.structuredRequirements ?? [], replaces: spell.replaces ?? [] }}
                schema={spellSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.spell(spell.id)}
                renderSheetContent=
                {
                  (isPending, formId) => <EditSpellSheet isPending={isPending} formId={formId} />
                }
                cacheKeys={['spells']}
              />

            </CompendiumEditView>
          )
        }
      </PerkableBadgeView>

    </CompendiumView>
  );
}

function EditSpellSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <EditSheet
      isPending={isPending}
      formId={formId}
      title={displayedText.editSpell}
    >
      <PerkEditableFields entityType="spells" />
      <ReplacesListField group="spells" />
      <SpellEditableFields  />
    </EditSheet>
  )
}