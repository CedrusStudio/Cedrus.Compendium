import { Label } from "@/ui/label"
import { displayedText } from '@/presentation/translations';
import { FieldPath } from 'react-hook-form';
import { InputFormField } from '@/common/components/form/InputFormField';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import FormTagsInput from '@/common/components/inputs/FormTagsInput';
import { InventoryItemDto } from '@/persistence/schemas/characters/equipment/itemSchema';

type EditItemViewProps =
{
    pathPrefix?: string;
}

export default function ItemEditableFields({ pathPrefix = ""}: EditItemViewProps)
{
  return (
    <>
        <div className="grid auto-rows-min gap-3">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.name}</span></Label>

            <InputFormField<InventoryItemDto> 
                path={(`${pathPrefix}name` as FieldPath<InventoryItemDto>)}
                inputPlaceholder={displayedText.changeName} inputClassName='w-80' 
            />
        </div>

        <div className="grid auto-rows-min gap-3 px-4 place-content-center place-items-center">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.description}</span></Label>

            <AreaInputFormField<InventoryItemDto> 
                path={(`${pathPrefix}description` as FieldPath<InventoryItemDto>)} 
                inputPlaceholder={displayedText.changeDescription} inputClassName='w-80' 
            />
        </div>

        <FormTagsInput<InventoryItemDto> path={`${pathPrefix}tags` as FieldPath<InventoryItemDto>} />
    </>
  );
};
