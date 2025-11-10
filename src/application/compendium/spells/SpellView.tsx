"use client";

import client from "@/infrastructure/clients/spellsClient";
import { type Spell } from "@/domain/characters/combat/Power";
import { allowedCastTimes } from "@/domain/characters/Castable";
import { Label } from "@/ui/label";
import { InputFormField } from '@/common/components/form/InputFormField';
import { SelectFormField } from '@/common/components/form/SelectFormField';
import { displayedText } from '@/presentation/translations';
import { battleIcon, cooldownIcon, costIcon, priceIcon } from '@/presentation/icons';
import { Badge } from '@/common/components/ui/badge';
import { getBadgeVariant } from '@/presentation/colors';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteSpellById } from '@/application/compendium/spells/hooks/useDeleteSpellById';
import { SpellDto, spellSchema } from "@/persistence/schemas/characters/combat/powerSchema";
import RequirementsView from "@/application/common/RequirementsView";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { PerkableEditSheet } from "@/application/common/PerkableEditSheet";

type SpellViewProps =
{
  spell: Spell;
  disableEdit?: boolean;
}

export default function SpellView({ spell, disableEdit = false }: SpellViewProps)
{
  const { deleteSpell, isPending } = useDeleteSpellById();

  return (
    <div className="flex flex-row items-center border rounded-md p-2">

      <SummaryView entity={spell} />

      <div className="p-2 rounded-md w-full">
        <RequirementsView entityWithRequirements={spell} />
      </div>
      
      <div className="flex flex-row items-center gap-2">

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
            <>
              <DeleteButton id={spell.id} isPending={isPending} deleteAction={deleteSpell} />

              <EditFormForSheet<SpellDto> 
                entityId={spell.id}
                defaultValues={spell}
                schema={spellSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.spell(spell.id)}
                renderSheetContent={(isPending, formId) => <EditSpellSheet isPending={isPending} formId={formId} />}
                cacheKeys={['spells']}
              />

            </>
          )
        }
      </div>

    </div>
  );
}

function EditSpellSheet({ isPending, formId }: { isPending: boolean, formId: string })
{
  return (
    <PerkableEditSheet<SpellDto>
      isPending={isPending}
      formId={formId}
      displayedTitle={displayedText.editSpell}
    >
      <div className="flex flex-wrap place-content-center gap-4">
        <div className="grid auto-rows-min gap-3 px-4">
          <Label className='justify-center capitalize'>{displayedText.cooldown}</Label>
          <InputFormField<SpellDto> path='cooldown' inputClassName='w-11 h-10 text-center font-medium' />
        </div>

        <div className="grid auto-rows-min gap-3 px-4">
          <Label className='justify-center capitalize'>{displayedText.cost}</Label>
          <InputFormField<SpellDto> path='cost' inputClassName='w-14 h-10 text-center font-medium'  />
        </div>
        
        <div className="flex flex-col items-center gap-3 px-4">
          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
          <SelectFormField<SpellDto> path='castTime' labelText={displayedText.castTime} items={allowedCastTimes} />
        </div>

      </div>
    </PerkableEditSheet>
  )
}