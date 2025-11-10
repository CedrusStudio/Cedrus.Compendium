import { pathToWeapons, splitEquipmentItemTypes } from '@/domain/characters/equipment/Equipment';
import { Weapon } from '@/domain/characters/equipment/Weapon';
import WeaponViewFields from '@/application/common/equipment/Views/WeaponViewFields';
import EditCharacterItemSheet from '@/application/characters/edit/equipment/EditCharacterItemSheet';
import ImportedBadge from '@/common/components/labels/ImportedBadge';
import WeaponEditableFields from '@/application/common/equipment/EditSheets/WeaponEditableFields';
import { useFieldArray } from 'react-hook-form';
import { type EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';

type EditWeaponViewProps = 
{
  weapon: Weapon;
  index: number;
  isImported: boolean;
};

export default function EditWeaponView({ index, weapon, isImported }: EditWeaponViewProps)
{
  const type = pathToWeapons(index);
  const { name } = splitEquipmentItemTypes(type);
  const { remove } = useFieldArray<EquipmentDto>({ name });

  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <WeaponViewFields weapon={weapon} />
        <ImportedBadge isImported={isImported} />
      </div>
      <div className="flex justify-end items-center gap-3">
        <RemoveFromArrayButton remove={remove} index={index} />
        {!isImported && <EditWeaponSheet index={index} />}
      </div>
    </div>
  )
}

type EditWeaponSheetProps = 
{
  index: number;
};

function EditWeaponSheet({ index }: EditWeaponSheetProps)
{
  const type = pathToWeapons(index);

  return (
    <EditCharacterItemSheet type={`weapons.${index}`} >
      <WeaponEditableFields pathPrefix={type + "."} />
    </EditCharacterItemSheet>
  )
}
