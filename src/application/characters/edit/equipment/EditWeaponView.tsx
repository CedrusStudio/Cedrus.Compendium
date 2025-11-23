import { pathToWeapons, splitEquipmentItemTypes } from '@/domain/characters/equipment/Equipment';
import { Weapon } from '@/domain/characters/equipment/Weapon';
import WeaponViewFields from '@/application/common/equipment/Views/WeaponViewFields';
import EditCharacterItemSheet from '@/application/characters/edit/equipment/EditCharacterItemSheet';
import WeaponEditableFields from '@/application/common/equipment/EditSheets/WeaponEditableFields';
import { useFieldArray } from 'react-hook-form';
import { type EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

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
    <ItemViewFromEditList
      itemViewFields={<WeaponViewFields weapon={weapon} />}
      itemEditSheet={<EditWeaponSheet index={index} />}
      index={index}
      isImported={isImported}
      remove={remove}
    />
  );
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
