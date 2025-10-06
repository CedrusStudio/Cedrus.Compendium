import { SelectFormField } from '@/ui/SelectFormField';
import { Label } from "@/ui/label"
import { criticalPowers, criticalRanges, diceAmounts, diceBonuses, diceGrades } from '@/domain/data/Dices';
import { Weapon, pathToWeaponsDamageOffenseField, pathToWeaponsField, pathToWeaponsWeaponOffenseCriticalField, pathToWeaponsWeaponOffenseField, allowedStyles } from '@/domain/characters/Character';
import { UpsertCharacterEquipmentType } from '@/persistence/characterSchemas';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion";
import WeaponView from '@/application/characters/equipment/WeaponView';
import EditItemSheet from '@/application/characters/edit/equipment/EditItemSheet';
import { translate } from '@/domain/data/translations';

type AccordionWeaponItemProps = 
{
  equipmentFormName: string;
  weapon: Weapon;
  isPending: boolean;
  index: number;
};

export default function EditWeaponView({ equipmentFormName, index, weapon, isPending }: AccordionWeaponItemProps)
{
  return (
    <AccordionItem value={`weapon${index}`}>
        <AccordionTrigger>{weapon.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
          <WeaponView weapon={weapon} />
          <EditWeaponSheet equipmentFormName={equipmentFormName} index={index} weapon={weapon} isPending={isPending} />
        </AccordionContent>
    </AccordionItem>
  )
}

function EditWeaponSheet({ equipmentFormName, weapon, index, isPending }: AccordionWeaponItemProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName}
      item={{ name: weapon.name, description: weapon.description, type: `weapons.${index}` }} 
      isPending={isPending}
    >
      <div className="flex flex-row gap-3 px-14">
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{translate('style')}</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              path={pathToWeaponsField(index, `style`)}
              items={allowedStyles}
              noLabel
              />
              
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{translate('range')}</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
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

function WeaponDiceEditor({ index }: Pick<AccordionWeaponItemProps, 'index'>)
{
  return (
  <>
    <Label className='justify-center'>{translate('weaponDice')}</Label>
      <div className="flex flex-row gap-3 px-14">
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{translate('amount')}</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              path={pathToWeaponsWeaponOffenseField(index, `amount`)}
              items={diceAmounts}
              noLabel
              />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{translate('grade')}</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              path={pathToWeaponsWeaponOffenseField(index, `grade`)}
              items={diceGrades}
              noLabel
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Bonus</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              path={pathToWeaponsWeaponOffenseField(index, `bonus`)}
              items={diceBonuses}
              noLabel
              />
        </div>

      </div>
    </>
  );
}

function DamageDiceEditor({ index }: Pick<AccordionWeaponItemProps, 'index'>)
{
  return (
    <>
      <Label className='justify-center capitalize'>{translate('damageDice')}</Label>

        <div className="flex flex-row justify-center gap-3">
              
          <div className="grid auto-rows-min gap-3 px-4">

            <Label className='capitalize'>{translate('amount')}</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                path={pathToWeaponsDamageOffenseField(index, `amount`)}
                items={diceAmounts}
                noLabel
                />
          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label className='capitalize'>{translate('grade')}</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                path={pathToWeaponsDamageOffenseField(index, `grade`)}
                items={diceGrades}
                noLabel
                />
          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Bonus</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                path={pathToWeaponsDamageOffenseField(index, `bonus`)}
                items={diceBonuses}
                noLabel
                />
          </div>
          
        </div>
    </>
  );
}

function CriticalEditor({ index }: Pick<AccordionWeaponItemProps, 'index'>)
{
  return (
    <>
      <Label className='justify-center capitalize'>{translate('critical')}</Label>

      <div className="flex flex-row justify-center gap-3">
            
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{translate('range')}</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              path={pathToWeaponsWeaponOffenseCriticalField(index, `range`)}
              items={criticalRanges}
              noLabel
              />
        </div>

        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='capitalize'>{translate('power')}</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              path={pathToWeaponsWeaponOffenseCriticalField(index, `power`)}
              items={criticalPowers}
              noLabel
              />
        </div>
        
      </div>
    </>
    )
  }
