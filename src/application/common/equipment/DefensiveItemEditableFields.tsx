import { SelectFormField } from '@/common/components/form/SelectFormField';
import { Label } from "@/ui/label"
import { displayedText } from '@/presentation/translations';
import { FieldPath, FieldValues } from 'react-hook-form';
import { DefensiveItemDto } from '@/persistence/schemas/characters/equipment/defenseItemSchema';
import { allowedResistances, allowedDexterityRestrictions, allowedInitiativeRestrictions, allowedStrengthRequirements } from "@/domain/characters/equipment/Item";
import { allowedItemAttributePenalties } from "@/domain/characters/equipment/Item";

type EditDefensiveItemViewProps =
{
    pathPrefix?: string;
}

export default function DefensiveItemEditableFields<TEditable extends FieldValues & Omit<DefensiveItemDto, "id">>({ pathPrefix = ""}: EditDefensiveItemViewProps)
{
  return (
    <div className="grid auto-rows-min gap-3 px-4">

        <div className="grid auto-rows-min gap-3 px-4 items-center justify-center">

            <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.resistance}</span></Label>

            <SelectFormField<TEditable> 
                path={(`${pathPrefix}resistance`) as FieldPath<TEditable>}
                items={allowedResistances}
                noLabel
            />

        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.attributePenalty}</span></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}attributePenalty`) as FieldPath<TEditable>}
                    items={allowedItemAttributePenalties}
                    noLabel
                />

            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.strengthRequirement}</span></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}strengthRequirement`) as FieldPath<TEditable>}
                    items={allowedStrengthRequirements}
                    noLabel
                />

            </div>
                
        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.dexterityRestriction}</span></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}dexterityRestriction`) as FieldPath<TEditable>}
                    items={allowedDexterityRestrictions}
                    noLabel
                />

            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.initiativeRestriction}</span></Label>

                <SelectFormField<TEditable> 
                    path={(`${pathPrefix}initiativeRestriction`) as FieldPath<TEditable>}
                    items={allowedInitiativeRestrictions}
                    noLabel
                />
                
            </div>

        </div>
    </div>
  );
};
