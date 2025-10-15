import { Defense, pathToDefenseField } from '@/domain/characters/combat/Defense';
import { UpsertCharacterDefenseType, type UpsertCharacterCombatType } from "@/persistence/characterSchemas";
import { InputFormField } from "@/common/components/form/InputFormField";
import { Label } from "@/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/card';
import { translate } from '@/presentation/translations';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import RemoveFromArrayButton from '@/common/components/form/RemoveFromArrayButton';
import { UseFieldArrayRemove } from 'react-hook-form';

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
          <InputFormField<UpsertCharacterCombatType> path={pathToDefenseField(index, 'name')} inputClassName='w-60 h-10 text-center font-medium' />
          <RemoveFromArrayButton index={index} remove={remove} />
        </CardTitle>
      </CardHeader>

      <CardContent className='flex flex-col gap-6 -mt-2'>

        <AreaInputFormField<UpsertCharacterCombatType> 
          path={pathToDefenseField(index, 'description')}
          inputPlaceholder={translate("changeDescription")}
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        { 
          Object.keys(defense).filter(NotNameOrDescriptionOrId).map(key => InputFormWithLabel(index, key as keyof UpsertCharacterDefenseType)) 
        }
        </div>

      </CardContent>
    </Card>
  );
};

function InputFormWithLabel(index: number, defenseFieldName: keyof UpsertCharacterDefenseType)
{   
  const fieldPath = pathToDefenseField(index, defenseFieldName);

  return (
    <div key={defenseFieldName} className="flex flex-col items-center gap-2">
      <Label className="text-center capitalize">{translate(defenseFieldName)}</Label>
      <InputFormField<UpsertCharacterCombatType> path={fieldPath} inputClassName='w-16 h-10 text-center font-medium' />
    </div>
  );
}

function NotNameOrDescriptionOrId(key: string)
{
  return key !== 'name' && key !== 'description' && key !== 'id';
}