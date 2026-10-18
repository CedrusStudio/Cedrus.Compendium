"use client";

import { CharacterMembershipAction } from '@/application/compendium/character-scope/CharacterMembershipAction';
import client from "@/infrastructure/clients/equipment/weaponsClient";
import { type Weapon } from "@/domain/characters/equipment/Weapon";
import { displayedText } from '@/common/translations';
import DeleteButton from '@/common/components/buttons/DeleteButton';
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";
import { WeaponDto, weaponSchema } from "@/persistence/schemas/characters/equipment/weaponSchema";
import { createCompendiumFormId } from "@/application/compendium/compendiumFormConstants";
import { EditFormForSheet } from "@/common/components/form/EditFormForSheet";
import { EditSheet } from "@/common/components/sheets/EditSheet";
import ItemEditableFields from "@/application/common/equipment/EditSheets/ItemEditableFields";
import WeaponEditableFields from "@/application/common/equipment/EditSheets/WeaponEditableFields";
import WeaponViewFields from "@/application/common/equipment/Views/WeaponViewFields";
import CompendiumView from "@/application/compendium/CompendiumView";
import CompendiumEditView from "@/application/compendium/CompendiumEditView";
import OwnedByCharacters from "@/application/common/OwnedByCharacters";

type WeaponViewProps =
{
  weapon: Weapon;
  disableEdit?: boolean;
  characterScope?: boolean;
  onDelete?: (id: string) => void;
}

export default function WeaponView({ weapon, disableEdit = false, characterScope = false, onDelete }: WeaponViewProps)
{
  const { deleteEntity: deleteWeapon, isPending } = useDeleteEntity({
    client,
    queryKey: ['weapons'],
    redirectPath: onDelete ? undefined : '/compendium/equipment/weapons',
    onOptimisticDelete: onDelete
  });

  return (
    <CompendiumView characterActions={characterScope ? <CharacterMembershipAction kind="weapons" entityId={weapon.id} label={weapon.name} /> : undefined}>

      <WeaponViewFields weapon={weapon} />

      <OwnedByCharacters entity="weapons" id={weapon.id} />

      {
        !disableEdit && (
          <CompendiumEditView>
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
                  <EditSheet title={displayedText.editingItem} isPending={isPending} formId={formId}>
                    <ItemEditableFields entityType="weapons" />
                    <WeaponEditableFields />
                  </EditSheet>
                )
              }
              cacheKeys={['weapons']}
            />

          </CompendiumEditView>
        )
      }

    </CompendiumView>
  );
}
