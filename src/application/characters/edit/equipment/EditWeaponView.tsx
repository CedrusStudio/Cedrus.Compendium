import { SelectFormField } from '@/ui/SelectFormField';
import { Label } from "@/ui/label"
import { criticalPowers, criticalRanges, diceAmounts, diceBonuses, diceGrades } from '@/domain/data/Dices';
import { Weapon } from '@/domain/characters/Character';
import { Control } from 'react-hook-form';
import { UpsertCharacterEquipmentType } from '@/persistence/characterSchemas';
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/ui/accordion";
import WeaponView from '@/application/characters/equipment/WeaponView';
import EditItemSheet from '@/application/characters/edit/equipment/EditItemSheet';

type AccordionWeaponItemProps = 
{
  equipmentFormName: string;
  weapon: Weapon;
  control: Control<UpsertCharacterEquipmentType>;
  weaponNumber: 1 | 2 | 3 | 4;
  isPending: boolean;
};

export default function EditWeaponView({ equipmentFormName, weapon, control, weaponNumber, isPending }: AccordionWeaponItemProps)
{
  return (
    <AccordionItem value={`weapon${weaponNumber}`}>
        <AccordionTrigger>{weapon.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
          <WeaponView weapon={weapon} />
          <EditWeaponSheet equipmentFormName={equipmentFormName} weapon={weapon} control={control} weaponNumber={weaponNumber} isPending={isPending} />
        </AccordionContent>
    </AccordionItem>
  )
}

function EditWeaponSheet({ equipmentFormName, weapon, control, weaponNumber, isPending }: AccordionWeaponItemProps)
{
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
              control={control}
              items={["None", "One-Handed", "Two-Handed", "Ranged", "Thrown"]}
              noLabel
              />
          </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Range</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.range`}
              control={control}
              items={[1,2,3,4,5]}
              noLabel
              />

        </div>

      </div>

      <WeaponDiceEditor control={control} weaponNumber={weaponNumber} />
      <CriticalEditor control={control} weaponNumber={weaponNumber} />
      <DamageDiceEditor control={control} weaponNumber={weaponNumber} />
      
    </EditItemSheet>
  )
}

function WeaponDiceEditor({ control, weaponNumber }: Pick<AccordionWeaponItemProps, 'control' | 'weaponNumber'>)
{
  return (
  <>
    <Label className='justify-center'>Weapon Dice</Label>
      <div className="flex flex-row gap-3 px-14">
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Amount</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.amount`}
              control={control}
              items={diceAmounts}
              noLabel
              />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label> Grade</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.grade`}
              control={control}
              items={diceGrades}
              noLabel
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Bonus</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.bonus`}
              control={control}
              items={diceBonuses}
              noLabel
              />
        </div>

      </div>
    </>
  );
}

function DamageDiceEditor({ control, weaponNumber }: Pick<AccordionWeaponItemProps, 'control' | 'weaponNumber'>)
{
  return (
    <>
      <Label className='justify-center'>Damage Dice</Label>

        <div className="flex flex-row justify-center gap-3">
              
          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Amount</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                name={`weapon${weaponNumber}.damageBonus.amount`}
                control={control}
                items={diceAmounts}
                noLabel
                />
          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Grade</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                name={`weapon${weaponNumber}.damageBonus.grade`}
                control={control}
                items={diceGrades}
                noLabel
                />
          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label>Bonus</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                name={`weapon${weaponNumber}.damageBonus.bonus`}
                control={control}
                items={diceBonuses}
                noLabel
                />
          </div>
          
        </div>
    </>
  );
}

function CriticalEditor({ control, weaponNumber }: Pick<AccordionWeaponItemProps, 'control' | 'weaponNumber'>)
{
  return (
    <>
      <Label className='justify-center'>Critical</Label>

      <div className="flex flex-row justify-center gap-3">
            
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Range</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.critical.range`}
              control={control}
              items={criticalRanges}
              noLabel
              />
        </div>

        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Power</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`weapon${weaponNumber}.offense.critical.power`}
              control={control}
              items={criticalPowers}
              noLabel
              />
        </div>
        
      </div>
    </>
    )
  }
