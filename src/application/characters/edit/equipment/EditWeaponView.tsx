import { pathToWeapons } from '@/domain/characters/equipment/Equipment';
import { Weapon } from '@/domain/characters/equipment/Weapon';
import WeaponView from '@/application/characters/equipment/WeaponView';
import EditCharacterItemSheet from '@/application/characters/edit/equipment/EditCharacterItemSheet';
import ImportedBadge from '@/common/components/labels/ImportedBadge';
import WeaponEditableFields from '@/application/common/equipment/WeaponEditableFields';
import { WeaponDto } from '@/persistence/schemas/characters/equipment/weaponSchema';

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
      {!isImported && <EditWeaponSheet index={index} weapon={weapon} />}
    </div>
  )
}

type EditWeaponSheetProps = Pick<EditWeaponViewProps, 'weapon' | 'index'>;

function EditWeaponSheet({ weapon, index }: EditWeaponSheetProps)
{
  const type = pathToWeapons(index);

  return (
    <EditCharacterItemSheet item={{ name: weapon.name, description: weapon.description, type: `weapons.${index}` }} >
      <WeaponEditableFields<WeaponDto> pathPrefix={type + "."} />
    </EditCharacterItemSheet>
  )
}
