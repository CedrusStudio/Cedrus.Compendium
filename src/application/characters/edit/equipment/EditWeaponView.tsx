import { pathToWeapons } from '@/domain/characters/equipment/Equipment';
import { Weapon } from '@/domain/characters/equipment/Weapon';
import WeaponViewFields from '@/application/common/equipment/Views/WeaponViewFields';
import EditCharacterItemSheet from '@/application/characters/edit/equipment/EditCharacterItemSheet';
import ImportedBadge from '@/common/components/labels/ImportedBadge';
import WeaponEditableFields from '@/application/common/equipment/EditSheets/WeaponEditableFields';

type EditWeaponViewProps = 
{
  weapon: Weapon;
  index: number;
  isImported: boolean;
};

export default function EditWeaponView({ index, weapon, isImported }: EditWeaponViewProps)
{
  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <WeaponViewFields weapon={weapon} />
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditWeaponSheet index={index} />}
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
