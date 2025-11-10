import { pathToWeapons } from '@/domain/characters/equipment/Equipment';
import { Weapon } from '@/domain/characters/equipment/Weapon';
import WeaponView from '@/application/characters/equipment/WeaponView';
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
    <div className="flex flex-row justify-between items-start">
      <div className="flex items-center">
        <WeaponView weapon={weapon} />
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
