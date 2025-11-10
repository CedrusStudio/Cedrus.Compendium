"use client";

import client from "@/infrastructure/clients/equipment/weaponsClient";
import { type Weapon } from "@/domain/characters/equipment/Weapon";
import { displayedText } from '@/presentation/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { WeaponDto, weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { ItemEditSheet } from "@/application/common/equipment/EditSheets/ItemEditSheet";
import WeaponEditableFields from "@/application/common/equipment/EditSheets/WeaponEditableFields";
import WeaponViewFields from "@/application/common/equipment/Views/WeaponViewFields";

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
    <div className="flex flex-row items-center border rounded-md p-2 gap-2">

      <WeaponViewFields weapon={weapon} />

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
  );
}
