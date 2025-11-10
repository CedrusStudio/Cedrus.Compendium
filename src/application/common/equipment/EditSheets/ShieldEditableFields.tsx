import { SelectFormField } from '@/common/components/form/SelectFormField';
import { Label } from "@/ui/label"
import { displayedText } from '@/presentation/translations';
import { FieldPath } from 'react-hook-form';
import { ArmorDto } from '@/persistence/schemas/characters/equipment/armorSchema';
import DefensiveItemEditableFields from '@/application/common/equipment/EditSheets/DefensiveItemEditableFields';
import { allowedProtections } from '@/domain/characters/equipment/Armor';

type EditShieldViewProps =
{
    pathPrefix?: string;
}

export default function ShieldEditableFields({ pathPrefix = ""}: EditShieldViewProps)
{
  return (
    <>
      <div className="grid auto-rows-min gap-3 justify-center items-center">

        <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.block}</span></Label>

        <SelectFormField<ArmorDto> 
          path={(`${pathPrefix}block` as FieldPath<ArmorDto>)}
          items={allowedProtections}
          noLabel
        />

      </div>

      <DefensiveItemEditableFields<ArmorDto> pathPrefix={pathPrefix} />
    </>
  );
};
