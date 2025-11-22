import { SelectFormField } from '@/common/components/form/SelectFormField';
import { Label } from "@/ui/label"
import { displayedText } from '@/presentation/translations';
import { FieldPath } from 'react-hook-form';
import { ArmorDto } from '@/persistence/schemas/characters/equipment/armorSchema';
import DefensiveItemEditableFields from '@/application/common/equipment/EditSheets/DefensiveItemEditableFields';
import { allowedImmunities, allowedProtections } from '@/domain/characters/equipment/Armor';

type EditArmorViewProps =
{
    pathPrefix?: string;
}

export default function ArmorEditableFields({ pathPrefix = ""}: EditArmorViewProps)
{
  return (
    <>
      <div className="flex flex-row auto-rows-min gap-3 place-items-center place-content-center">

        <div className='flex flex-row gap-4 '>
          
          <div className='flex flex-col gap-3 px-4 place-items-center'>
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.protection}</span></Label>

            <SelectFormField<ArmorDto> 
              path={(`${pathPrefix}protection` as FieldPath<ArmorDto>)}
              items={allowedProtections}
              noLabel
              />
          </div>

          <div className='flex flex-col gap-3 px-4 place-items-center'>
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.immunity}</span></Label>

            <SelectFormField<ArmorDto> 
              path={(`${pathPrefix}immunity` as FieldPath<ArmorDto>)}
              items={allowedImmunities}
              noLabel
              />
            </div>
            
        </div>

      </div>

      <DefensiveItemEditableFields<ArmorDto> pathPrefix={pathPrefix} />
    </>
  );
};
