import { Label } from "@/ui/label"
import { displayedText } from '@/common/translations';
import { FieldPath } from 'react-hook-form';
import { InputFormField } from '@/common/components/form/InputFormField';
import AreaInputFormField from '@/common/components/form/AreaInputFormField';
import FormTagsInput from '@/common/components/inputs/FormTagsInput';
import RequirementListField from "@/application/common/requirements/RequirementListField";
import { Perk } from "@/domain/characters/Perk";
import { RequirementEntityType } from "@/common/hooks/useEntityRequirements";

type PerkEditableFieldsProps =
{
    pathPrefix?: string;
    entityType?: RequirementEntityType;
}

export default function PerkEditableFields({ pathPrefix = "", entityType }: PerkEditableFieldsProps)
{
  return (
    <>
        <div className="flex justify-around">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.name}</span></Label>
                <InputFormField<Perk> 
                    path={`${pathPrefix}name` as FieldPath<Perk>}  
                    inputPlaceholder={displayedText.changeName} 
                    inputClassName='w-60' 
                />
            </div>
      
            <div className="grid auto-rows-min gap-3 px-4">
                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.grade}</span></Label>
                <InputFormField<Perk> 
                    path={`${pathPrefix}grade` as FieldPath<Perk>} 
                    inputClassName="w-11 h-10 text-center font-medium" 
                />
            </div>

        </div>

        <div className="grid auto-rows-min gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.description}</span></Label>
            <AreaInputFormField<Perk> 
                path={`${pathPrefix}description` as FieldPath<Perk>} 
                inputPlaceholder={displayedText.changeDescription} 
                inputClassName='w-80' 
            />
        </div>

        <FormTagsInput<Perk> path={`${pathPrefix}tags` as FieldPath<Perk>} entityType={entityType} />
        <RequirementListField name={`${pathPrefix}structuredRequirements`} />

        <div className="grid auto-rows-min gap-3 px-4">
            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.price}</span></Label>
            <InputFormField<Perk> 
                path={`${pathPrefix}price` as FieldPath<Perk>} 
                inputClassName='w-11 h-10 text-center font-medium'  
            />
        </div>
    </>
  );
};
