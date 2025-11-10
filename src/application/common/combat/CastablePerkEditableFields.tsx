import { SelectFormField } from '@/common/components/form/SelectFormField';
import { Label } from "@/ui/label"
import { displayedText } from '@/presentation/translations';
import { InputFormField } from '@/common/components/form/InputFormField';
import { CastablePerkDto } from '@/persistence/schemas/characters/combat/maneuverSchema';
import { allowedCastTimes } from '@/domain/characters/Castable';
import { FieldPath } from 'react-hook-form';

type EditCastablePerkViewProps =
{
    pathPrefix?: string;
}

export default function CastablePerkEditableFields({ pathPrefix = ""}: EditCastablePerkViewProps)
{
  return (
    <>
      <div className="grid grid-cols-2 gap-4">

        <div className="grid auto-rows-min gap-3 px-4">
          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.cooldown}</span></Label>
          <InputFormField<CastablePerkDto> 
            path={(`${pathPrefix}cooldown` as FieldPath<CastablePerkDto>)}
            inputClassName='w-11 h-10 text-center font-medium' 
          />
        </div>

        <div className="flex flex-col items-center gap-3 px-4">
          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.castTime}</span></Label>
          <SelectFormField<CastablePerkDto> 
            path={(`${pathPrefix}castTime` as FieldPath<CastablePerkDto>)} 
            labelText={displayedText.castTime} 
            items={allowedCastTimes} 
          />
        </div>

      </div>
    </>
  );
};
