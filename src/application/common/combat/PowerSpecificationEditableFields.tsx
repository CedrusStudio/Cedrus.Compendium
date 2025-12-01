import { Label } from "@/ui/label"
import { displayedText } from '@/presentation/translations';
import { InputFormField } from '@/common/components/form/InputFormField';
import { PowerSpecification } from "@/domain/characters/combat/Power";
import AreaInputFormField from "@/common/components/form/AreaInputFormField";
import FormTagsInput from "@/common/components/inputs/FormTagsInput";

export default function PowerSpecificationEditableFields()
{
  return (
    <>
      <div className="flex justify-around">
        <div className="grid auto-rows-min gap-3 px-4">
          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.name}</span></Label>
          <InputFormField<PowerSpecification> 
              path={'name'}  
              inputPlaceholder={displayedText.changeName} 
              inputClassName='w-60' 
          />
        </div>
      </div>

      <div className="grid auto-rows-min gap-3 px-4">
        <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.description}</span></Label>
        <AreaInputFormField<PowerSpecification> 
          path={'description'} 
          inputPlaceholder={displayedText.changeDescription} 
          inputClassName='w-80' 
        />
      </div>

      <FormTagsInput<PowerSpecification> path={'tags'} />

      {/* Select which powerOffense to edit from 0 to 15 */}
      {/* Can be  */}
    </>
  );
};

function PowerOffenseEditor()
{
  return (
    <>
    </>
  );
}