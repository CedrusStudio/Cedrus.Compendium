import { Label } from "@/ui/label"
import { displayedText } from '@/presentation/translations';
import { InputFormField } from '@/common/components/form/InputFormField';
import { FieldPath } from 'react-hook-form';
import { SpellDto } from "@/persistence/schemas/characters/combat/powerSchema";
import CastablePerkEditableFields from "@/application/common/combat/CastablePerkEditableFields";

type SpellEditableFieldsProps =
{
  pathPrefix?: string;
}

export default function SpellEditableFields({ pathPrefix = ""}: SpellEditableFieldsProps)
{
  return (
    <>
      <CastablePerkEditableFields pathPrefix={pathPrefix} />

      <div className="grid auto-rows-min gap-3 px-4">
        <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.cost}</span></Label>
        <InputFormField<SpellDto> 
          path={(`${pathPrefix}cost` as FieldPath<SpellDto>)}
          inputClassName='w-16 h-10 text-center font-medium' 
        />
      </div>
    </>
  );
};
