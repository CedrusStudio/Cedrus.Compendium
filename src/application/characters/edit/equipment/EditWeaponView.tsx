import { SelectFormField } from '@/ui/SelectFormField';
import { Label } from "@/ui/label"
import { criticalPowers, criticalRanges, diceAmounts, diceBonuses, diceGrades } from '@/domain/data/dices';
import { Weapon } from '@/domain/characters/Character';
import { useFormContext } from 'react-hook-form';
import { UpsertCharacterEquipmentType } from '@/persistence/characterSchemas';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion";
import WeaponView from '@/application/characters/equipment/WeaponView';
import EditItemSheet from '@/application/characters/edit/equipment/EditItemSheet';

type AccordionWeaponItemProps = 
{
  equipmentFormName: string;
  weapon: Weapon;
  weaponNumber: 1 | 2 | 3 | 4;
  isPending: boolean;
};

export default function EditWeaponView({ equipmentFormName, weapon, weaponNumber, isPending }: AccordionWeaponItemProps)
{
  return (
    <AccordionItem value={`weapon${weaponNumber}`}>
        <AccordionTrigger>{weapon.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
          <WeaponView weapon={weapon} />
          <EditWeaponSheet equipmentFormName={equipmentFormName} weapon={weapon}  weaponNumber={weaponNumber} isPending={isPending} />
        </AccordionContent>
    </AccordionItem>
  )
}

function EditWeaponSheet({ equipmentFormName, weapon, weaponNumber, isPending }: AccordionWeaponItemProps)
{
  const { control } = useFormContext<UpsertCharacterEquipmentType>();

  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName}
      item={{ name: weapon.name, description: weapon.description, type: `weapon${weaponNumber}` }} 
      control={control} 
      isPending={isPending}
    >
      <div className="flex flex-row gap-3 px-14">
        
        <div className="grid auto-rows-min gap-3 px-4">
          
          <Label>Style</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.style`}
              items={["None", "One-Handed", "Two-Handed", "Ranged", "Thrown"]}
              noLabel
              />
          </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Range</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.range`}
              items={[1,2,3,4,5]}
              noLabel
              />

        </div>

      </div>

      <WeaponDiceEditor weaponNumber={weaponNumber} />
      <CriticalEditor weaponNumber={weaponNumber} />
      <DamageDiceEditor weaponNumber={weaponNumber} />
      
    </EditItemSheet>
  )
}

function WeaponDiceEditor({ weaponNumber }: Pick<AccordionWeaponItemProps, 'weaponNumber'>)
{
  return (
  <>
    <Label className='justify-center'>Weapon Dice</Label>
      <div className="flex flex-row gap-3 px-14">
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Amount</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.amount`}
              items={diceAmounts}
              noLabel
              />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label> Grade</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.grade`}
              items={diceGrades}
              noLabel
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Bonus</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.bonus`}
              items={diceBonuses}
              noLabel
              />
        </div>

      </div>
    </>
  );
}

function DamageDiceEditor({ weaponNumber }: Pick<AccordionWeaponItemProps, 'weaponNumber'>)
{
  return (
    <>
      <Label className='justify-center'>Damage Dice</Label>

        <div className="flex flex-row justify-center gap-3">
              
          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Amount</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                name={`weapon${weaponNumber}.damageBonus.amount`}
                items={diceAmounts}
                noLabel
                />
          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Grade</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                name={`weapon${weaponNumber}.damageBonus.grade`}
                items={diceGrades}
                noLabel
                />
          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Bonus</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                name={`weapon${weaponNumber}.damageBonus.bonus`}
                items={diceBonuses}
                noLabel
                />
          </div>
          
        </div>
    </>
  );
}

function CriticalEditor({ weaponNumber }: Pick<AccordionWeaponItemProps, 'weaponNumber'>)
{
  return (
    <>
      <Label className='justify-center'>Critical</Label>

      <div className="flex flex-row justify-center gap-3">
            
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Range</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.critical.range`}
              items={criticalRanges}
              noLabel
              />
        </div>

        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Power</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.critical.power`}
              items={criticalPowers}
              noLabel
              />
        </div>
        
      </div>
    </>
    )
  }
