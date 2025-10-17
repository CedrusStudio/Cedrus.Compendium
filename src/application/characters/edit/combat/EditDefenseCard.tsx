import { Defense, pathToDefenseField } from '@/domain/characters/combat/Defense';
import { type CombatDto } from "@/persistence/schemas/characters/combat/combatSchema";
import { type DefenseDto } from "@/persistence/schemas/characters/combat/defenseSchema";
import { InputFormField } from "@/common/components/form/InputFormField";
import { Label } from "@/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { UseFieldArrayRemove } from 'react-hook-form';
import { displayedText } from '@/presentation/translations';

type EditDefenseCardProps =
{
  index: number;
  defense: Defense;
  remove: UseFieldArrayRemove
}

export default function EditDefenseCard({ index, defense, remove }: EditDefenseCardProps)
{
  return (
    <Card className='bg-muted border shadow-md'>
      <CardHeader>
        <CardTitle className='flex justify-between items-center'>
          <InputFormField<CombatDto> path={pathToDefenseField(index, 'name')} inputClassName='w-60 h-10 text-center font-medium' />
          <RemoveFromArrayButton index={index} remove={remove} />
        </CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-6 -mt-2'>

        <AreaInputFormField<CombatDto> 
          path={pathToDefenseField(index, 'description')}
          inputPlaceholder={displayedText.changeDescription}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        { 
          (Object.keys(defense) as (keyof DefenseDto)[])
            .filter(NotNameOrDescriptionOrId)
            .map(key => InputFormWithLabel(index, key as keyof DefenseDto)) 
        }
        </div>

      </CardContent>
    </Card>
  );
};

function InputFormWithLabel(index: number, defenseFieldName: keyof DefenseDto)
{   
  const fieldPath = pathToDefenseField(index, defenseFieldName);

  return (
    <div key={defenseFieldName} className="flex flex-col items-center gap-2">
      <Label className="text-center capitalize">{displayedText[defenseFieldName as keyof typeof displayedText]}</Label>
      <InputFormField<CombatDto> path={fieldPath} inputClassName='w-16 h-10 text-center font-medium' />
    </div>
  );
}

function NotNameOrDescriptionOrId(key: keyof DefenseDto): boolean
{
  return key !== 'name' && key !== 'description' && key !== 'id';
}