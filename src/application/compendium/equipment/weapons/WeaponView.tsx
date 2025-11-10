"use client";

import client from "@/infrastructure/clients/equipment/weaponsClient";
import { type Weapon } from "@/domain/characters/equipment/Weapon";
import { displayedText } from '@/presentation/translations';
import { Badge } from '@/common/components/ui/badge';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { WeaponDto, weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import SummaryView from "@/application/common/SummaryView";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { ItemEditSheet } from "@/application/common/equipment/ItemEditSheet";
import WeaponEditableFields from "@/application/common/equipment/WeaponEditableFields";

type WeaponViewProps =
{
  weapon: Weapon;
  disableEdit?: boolean;
}

export default function WeaponView({ weapon, disableEdit = false }: WeaponViewProps)
{
  const { deleteEntity: deleteWeapon, isPending } = useDeleteEntity({
    client,
    queryKey: ['weapons'],
    redirectPath: '/compendium/equipment/weapons'
  });

  return (
    <div className="flex flex-row items-center border rounded-md p-2">

      <SummaryView entity={weapon} />

      <div className="flex flex-row items-center gap-2">

        <Badge variant="secondary" className="h-9 px-2 capitalize">
          <div className="text-xs">{displayedText.style}:</div>
          <div className="ml-1">{weapon.style}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.offense}:</div>
          <div className="ml-1">{weapon.offense.amount}k{weapon.offense.grade}+{weapon.offense.bonus}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.damage}:</div>
          <div className="ml-1">{weapon.damageBonus.amount}k{weapon.damageBonus.grade}+{weapon.damageBonus.bonus}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.critical}:</div>
          <div className="ml-1">{weapon.offense.critical.power}/{weapon.offense.critical.range}</div>
        </Badge>

        <Badge variant="secondary" className="h-9 px-2">
          <div className="text-xs">{displayedText.range}:</div>
          <div className="ml-1">{weapon.range}</div>
        </Badge>

        {
          !disableEdit && (
            <>
              <DeleteButton id={weapon.id} isPending={isPending} deleteAction={deleteWeapon} />

              <EditFormForSheet<WeaponDto> 
                entityId={weapon.id}
                defaultValues={weapon}
                schema={weaponSchema}
                updateFn={client.update}
                formId={createCompendiumFormId.weapon(weapon.id)}
                renderSheetContent=
                {
                  (isPending, formId) => (
                    <ItemEditSheet displayedTitle={displayedText.editingItem} isPending={isPending} formId={formId}>
                      <WeaponEditableFields />
                    </ItemEditSheet>
                  )
                }
                cacheKeys={['weapons']}
              />

            </>
          )
        }
      </div>

    </div>
  );
}
