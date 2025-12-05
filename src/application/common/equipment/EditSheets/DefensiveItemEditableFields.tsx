import { SelectFormField } from '@/common/components/form/SelectFormField';
import { Label } from "@/ui/label"
import { displayedText } from '@/presentation/translations';
import { FieldPath, FieldValues } from 'react-hook-form';
import { DefensiveItemDto } from '@/persistence/schemas/characters/equipment/defenseItemSchema';
import { allowedResistances, allowedDexterityRestrictions, allowedInitiativeRestrictions, allowedStrengthRequirements, allowedReflexRestrictions } from "@/domain/characters/equipment/Item";
import { allowedItemAttributePenalties } from "@/domain/characters/equipment/Item";

type EditDefensiveItemViewProps =
{
    pathPrefix?: string;
}

export default function DefensiveItemEditableFields<TEditable extends FieldValues & Omit<DefensiveItemDto, "id">>({ pathPrefix = ""}: EditDefensiveItemViewProps)
{
  return (
    <>
        <div className="flex flex-row place-items-center place-content-center">
            
          <div className='flex flex-col gap-3 px-4 place-items-center'>
                <Label><span className='first-letter:uppercase'>{displayedText.resistance}</span></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}resistance`) as FieldPath<TEditable>}
                    items={allowedResistances}
                    noLabel
                />
            </div>

          <div className='flex flex-col gap-3 px-4 place-items-center'>
                <Label><span className='first-letter:uppercase'>{displayedText.strengthRequirement}</span></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}strengthRequirement`) as FieldPath<TEditable>}
                    items={allowedStrengthRequirements}
                    noLabel
                />
            </div>

        </div>

        <div className="flex flex-row place-items-center place-content-center">

          <div className='flex flex-col gap-3 px-4 place-items-center'>
                <Label className='flex flex-col'><span className='first-letter:uppercase'>ograniczenie</span><Label>inicjatywy</Label></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}initiativeRestriction`) as FieldPath<TEditable>}
                    items={allowedInitiativeRestrictions}
                    noLabel
                />
            </div>

          <div className='flex flex-col gap-3 px-9 place-items-center'>
                <Label className='flex flex-col'><span className='first-letter:uppercase'>kara</span><Label>atrybutu</Label></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}attributePenalty`) as FieldPath<TEditable>}
                    items={allowedItemAttributePenalties}
                    noLabel
                />

            </div>
                
        </div>

        <div className="flex flex-row place-items-center place-content-center">

          <div className='flex flex-col gap-3 px-4 place-items-center'>
                <Label className='flex flex-col'><span className='first-letter:uppercase'>ograniczenie</span><Label>refleksu</Label></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}reflexRestriction`) as FieldPath<TEditable>}
                    items={allowedReflexRestrictions}
                    noLabel
                />

            </div>

          <div className='flex flex-col gap-3 px-4 place-items-center'>
                <Label className='flex flex-col'><span className='first-letter:uppercase'>ograniczenie</span><Label>zręczności</Label></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}dexterityRestriction`) as FieldPath<TEditable>}
                    items={allowedDexterityRestrictions}
                    noLabel
                />

            </div>

        </div>
    </>
  );
};
