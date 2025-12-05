"use client";

import client from "@/infrastructure/clients/spellsClient";
import { type Spell } from "@/domain/characters/combat/Power";
import { displayedText } from '@/presentation/translations';
import { battleIcon, cooldownIcon, costIcon, priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/presentation/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { SpellDto, spellSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import PerkEditableFields from "@/application/common/PerkEditableFields";
import SpellEditableFields from "@/application/common/combat/SpellEditableFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import PerkableBadgeView from "@/application/compendium/PerkableBadgeView";

type SpellViewProps =
{
  spell: Spell;
  disableEdit?: boolean;
}

export default function SpellView({ spell, disableEdit = false }: SpellViewProps)
{
  const { deleteEntity: deleteSpell, isPending } = useDeleteEntity({
    client,
    queryKey: ['spells'],
    redirectPath: '/compendium/spells'
  });

  return (
    <CompendiumView>

      <SummaryView entity={spell} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={spell} />
      </div>
      
      <PerkableBadgeView>

        <Badge variant="secondary" className="h-9 w-10 capitalize">
          <div>{priceIcon}</div>
          <div>{spell.price}</div>
        </Badge>

        <Badge variant="cost" className="h-9 w-14 capitalize ">
          <div>{costIcon}</div>
          <div>{spell.cost}</div>
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
                defaultValues={spell}
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
      <PerkEditableFields />
      <SpellEditableFields  />
    </EditSheet>
  )
}