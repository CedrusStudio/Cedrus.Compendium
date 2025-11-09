import { SelectFormField } from '@/common/components/form/SelectFormField';
import { Label } from "@/ui/label"
import { allowedCriticalPowers, allowedCriticalRanges, allowedDiceAmounts, allowedDiceBonuses, allowedDiceGrades } from '@/domain/characters/combat/Offense';
import { pathToWeaponsDamageOffenseField, pathToWeaponsWeaponOffenseCriticalField, pathToWeaponsWeaponOffenseField, allowedStyles } from '@/domain/characters/equipment/Weapon';
import { pathToWeaponsField } from '@/domain/characters/equipment/Equipment';
import { Weapon } from '@/domain/characters/equipment/Weapon';
import { type EquipmentDto } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import WeaponView from '@/application/characters/equipment/WeaponView';
import EditItemSheet from '@/application/characters/edit/equipment/EditItemSheet';
import { displayedText } from '@/presentation/translations';
import ImportedBadge from '@/common/components/labels/ImportedBadge';

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
  return (
    <EditItemSheet item={{ name: weapon.name, description: weapon.description, type: `weapons.${index}` }} >
      <div className="flex flex-row gap-3 px-14">
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{displayedText.style}</Label>

          <SelectFormField<EquipmentDto> 
            path={pathToWeaponsField(index, `style`)}
            items={allowedStyles}
            noLabel
          />
              
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{displayedText.range}</Label>

          <SelectFormField<EquipmentDto> 
            path={pathToWeaponsField(index, `range`)}
            items={[1,2,3,4,5]}
            noLabel
          />

        </div>

      </div>

      <WeaponDiceEditor index={index} />
      <CriticalEditor index={index} />
      <DamageDiceEditor index={index} />
      
    </EditItemSheet>
  )
}

function WeaponDiceEditor({ index }: Pick<EditWeaponViewProps, 'index'>)
{
  return (
  <>
    <Label className='justify-center capitalize text-yellow-600'>{displayedText.weaponDice}</Label>
      <div className="flex flex-row gap-3 px-14">
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{displayedText.amount}</Label>

          <SelectFormField<EquipmentDto> 
            path={pathToWeaponsWeaponOffenseField(index, `amount`)}
            items={allowedDiceAmounts}
            noLabel
            />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{displayedText.grade}</Label>

          <SelectFormField<EquipmentDto> 
            path={pathToWeaponsWeaponOffenseField(index, `grade`)}
            items={allowedDiceGrades}
            noLabel
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Bonus</Label>

          <SelectFormField<EquipmentDto> 
            path={pathToWeaponsWeaponOffenseField(index, `bonus`)}
            items={allowedDiceBonuses}
            noLabel
          />

        </div>

      </div>
    </>
  );
}

function DamageDiceEditor({ index }: Pick<EditWeaponViewProps, 'index'>)
{
  return (
    <>
      <Label className='justify-center capitalize text-yellow-600'>{displayedText.damageDice}</Label>

        <div className="flex flex-row justify-center gap-3">
              
          <div className="grid auto-rows-min gap-3 px-4">

            <Label className='capitalize'>{displayedText.amount}</Label>

            <SelectFormField<EquipmentDto> 
              path={pathToWeaponsDamageOffenseField(index, `amount`)}
              items={allowedDiceAmounts}
              noLabel
            />

          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label className='capitalize'>{displayedText.grade}</Label>

            <SelectFormField<EquipmentDto> 
              path={pathToWeaponsDamageOffenseField(index, `grade`)}
              items={allowedDiceGrades}
              noLabel
            />

          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Bonus</Label>

            <SelectFormField<EquipmentDto> 
              path={pathToWeaponsDamageOffenseField(index, `bonus`)}
              items={allowedDiceBonuses}
              noLabel
            />

          </div>
          
        </div>
    </>
  );
}

function CriticalEditor({ index }: Pick<EditWeaponViewProps, 'index'>)
{
  return (
    <>
      <Label className='justify-center capitalize'>{displayedText.critical}</Label>

      <div className="flex flex-row justify-center gap-3">
            
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{displayedText.range}</Label>

          <SelectFormField<EquipmentDto> 
            path={pathToWeaponsWeaponOffenseCriticalField(index, `range`)}
            items={allowedCriticalRanges}
            noLabel
          />

        </div>
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{displayedText.power}</Label>

          <SelectFormField<EquipmentDto> 
            path={pathToWeaponsWeaponOffenseCriticalField(index, `power`)}
            items={allowedCriticalPowers}
            noLabel
          />

        </div>
        
      </div>
    </>
    )
  }
