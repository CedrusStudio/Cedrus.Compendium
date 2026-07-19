import { pathToWeapons } from '@/domain/characters/equipment/Equipment';
import { Weapon } from '@/domain/characters/equipment/Weapon';
import WeaponViewFields from '@/application/common/equipment/Views/WeaponViewFields';
import EditCharacterItemSheet from '@/application/characters/edit/equipment/EditCharacterItemSheet';
import WeaponEditableFields from '@/application/common/equipment/EditSheets/WeaponEditableFields';
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

type EditWeaponViewProps =
{
  weapon: Weapon;
  index: number;
  isImported: boolean;
  isRemoved?: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
};

export default function EditWeaponView({ index, weapon, isImported, isRemoved, onRemove, onRestore }: EditWeaponViewProps)
{
  return (
    <ItemViewFromEditList
      itemViewFields={<WeaponViewFields weapon={weapon} />}
      itemEditSheet={<EditWeaponSheet index={index} />}
      index={index}
      isImported={isImported}
      isRemoved={isRemoved}
      onRemove={onRemove}
      onRestore={onRestore}
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
