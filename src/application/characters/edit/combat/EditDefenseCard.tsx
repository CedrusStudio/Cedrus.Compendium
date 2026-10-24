import { Defense, pathToDefenseField } from '@/domain/characters/combat/Defense';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { type DefenseDto } from "@/persistence/schemas/characters/combat/defenseSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import { Label } from "@/ui/label";
import { DataCard } from '@/common/components/cards/DataCard';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { UseFieldArrayRemove, useFormContext } from 'react-hook-form';
import { displayedText } from '@/common/translations';
import { Button } from '@/ui/button';

type EditDefenseCardProps =
{
  index: number;
  defense: Defense;
  remove: UseFieldArrayRemove
}

export default function EditDefenseCard({ index, defense, remove }: EditDefenseCardProps)
{
  const { watch, setValue } = useFormContext<CombatDto>();
  const defaultDefenseId = watch('defaultDefenseId');
  const actualDefenseId = watch(`defenses.${index}.id`);
  const isDefault = defaultDefenseId === actualDefenseId;

  const handleSetAsDefault = () => {
    setValue('defaultDefenseId', actualDefenseId);
  };

  return (
    <DataCard 
      variant="muted"
      className='border shadow-md'
      headerClassName='flex flex-wrap justify-between items-center gap-4'
      contentClassName='flex flex-col gap-6 -mt-2'
    >
    <div className='flex flex-wrap justify-between items-center gap-4'>
      <InputFormField<CombatDto> path={pathToDefenseField(index, 'name')} inputClassName='w-50 sm:w-60 h-10 text-center font-medium' />
      <div className='flex gap-2'>
        <Button 
          type='button'
          variant={isDefault ? "default" : "outline"}
          onClick={handleSetAsDefault}
          className='text-xs'
        >
          {isDefault ? '✓ Default' : 'Set as Default'}
        </Button>
        <RemoveFromArrayButton index={index} remove={remove} />
      </div>
    </div>

      <AreaInputFormField<CombatDto> 
        path={pathToDefenseField(index, 'description')}
        inputPlaceholder={displayedText.changeDescription}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      { 
        (Object.keys(defense) as (keyof DefenseDto)[])
          .filter(NotNameOrDescriptionOrId)
          .map(key => InputFormWithLabel(index, key as keyof DefenseDto)) 
      }
      </div>

    </DataCard>
  );
};

function InputFormWithLabel(index: number, defenseFieldName: keyof DefenseDto)
{   
  const fieldPath = pathToDefenseField(index, defenseFieldName);

  return (
    <div key={defenseFieldName} className="flex flex-col items-center gap-2">
      <Label className="text-center capitalize">{displayedText[defenseFieldName as keyof typeof displayedText]}</Label>
      <InputFormField<CombatDto> path={fieldPath} numeric inputClassName='w-16 h-10 text-center font-medium' />
    </div>
  );
}

function NotNameOrDescriptionOrId(key: keyof DefenseDto): boolean
{
  return key !== 'name' && key !== 'description' && key !== 'id';
}