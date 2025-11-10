import { SelectFormField } from '@/common/components/form/SelectFormField';
import { Label } from "@/ui/label"
import { allowedCriticalPowers, allowedCriticalRanges, allowedDiceAmounts, allowedDiceBonuses, allowedDiceGrades } from '@/domain/characters/combat/Offense';
import { allowedStyles, pathToWeaponDamageOffenseField, pathToWeaponOffenseCriticalField, pathToWeaponOffenseField } from '@/domain/characters/equipment/Weapon';
import { displayedText } from '@/presentation/translations';
import { FieldPath, FieldValues } from 'react-hook-form';
import { WeaponDto } from '@/persistence/schemas/characters/equipment/weaponSchema';

type EditWeaponViewProps =
{
    pathPrefix?: string;
}

export default function WeaponEditableFields<TEditable extends FieldValues & Omit<WeaponDto, "id">>({ pathPrefix = ""}: EditWeaponViewProps)
{
  return (
    <>
        <div className="flex flex-row gap-3 px-14">
        
            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.style}</span></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}style`) as FieldPath<TEditable>}
                    items={allowedStyles}
                    noLabel
                />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.range}</span></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}range`) as FieldPath<TEditable>}
                    items={[1,2,3,4,5]}
                    noLabel
                />
            </div>

        </div>

      <WeaponDiceEditor pathPrefix={pathPrefix} />
      <CriticalEditor pathPrefix={pathPrefix} />
      <DamageDiceEditor pathPrefix={pathPrefix} />
    </>
  );
};

function WeaponDiceEditor({ pathPrefix }: EditWeaponViewProps)
{
  return (
  <>
    <Label className='justify-center capitalize text-yellow-600'>{displayedText.weaponDice}</Label>
      <div className="flex flex-row gap-3 px-14">
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.amount}</span></Label>

          <SelectFormField<WeaponDto> 
            path={`${pathPrefix}${pathToWeaponOffenseField(`amount`)}` as FieldPath<WeaponDto>}
            items={allowedDiceAmounts}
            noLabel
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.grade}</span></Label>

          <SelectFormField<WeaponDto> 
            path={`${pathPrefix}${pathToWeaponOffenseField(`grade`)}` as FieldPath<WeaponDto>}
            items={allowedDiceGrades}
            noLabel
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.bonus}</span></Label>

          <SelectFormField<WeaponDto> 
            path={`${pathPrefix}${pathToWeaponOffenseField(`bonus`)}` as FieldPath<WeaponDto>}
            items={allowedDiceBonuses}
            noLabel
          />

        </div>

      </div>
    </>
  );
}

function DamageDiceEditor({ pathPrefix }: EditWeaponViewProps)
{
  return (
    <>
      <Label className='justify-center capitalize text-yellow-600'>{displayedText.damageDice}</Label>

        <div className="flex flex-row justify-center gap-3">
              
          <div className="grid auto-rows-min gap-3 px-4">

            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.amount}</span></Label>

            <SelectFormField<WeaponDto> 
              path={`${pathPrefix}${pathToWeaponDamageOffenseField(`amount`)}` as FieldPath<WeaponDto>}
              items={allowedDiceAmounts}
              noLabel
            />

          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.grade}</span></Label>

            <SelectFormField<WeaponDto> 
              path={`${pathPrefix}${pathToWeaponDamageOffenseField(`grade`)}` as FieldPath<WeaponDto>}
              items={allowedDiceGrades}
              noLabel
            />

          </div>
          
          <div className="grid auto-rows-min gap-3 px-4">

            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.bonus}</span></Label>

            <SelectFormField<WeaponDto> 
              path={`${pathPrefix}${pathToWeaponDamageOffenseField(`bonus`)}` as FieldPath<WeaponDto>}
              items={allowedDiceBonuses}
              noLabel
            />

          </div>
          
        </div>
    </>
  );
}

function CriticalEditor({ pathPrefix }: EditWeaponViewProps)
{
  return (
    <>
      <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.critical}</span></Label>
    
      <div className="flex flex-row justify-center gap-3">
            
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.range}</span></Label>

          <SelectFormField<WeaponDto> 
            path={`${pathPrefix}${pathToWeaponOffenseCriticalField(`range`)}` as FieldPath<WeaponDto>}
            items={allowedCriticalRanges}
            noLabel
          />

        </div>
        
        <div className="grid auto-rows-min gap-3 px-4">

          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.power}</span></Label>

          <SelectFormField<WeaponDto> 
            path={`${pathPrefix}${pathToWeaponOffenseCriticalField(`power`)}` as FieldPath<WeaponDto>}
            items={allowedCriticalPowers}
            noLabel
          />

        </div>
        
      </div>
    </>
    )
  }
