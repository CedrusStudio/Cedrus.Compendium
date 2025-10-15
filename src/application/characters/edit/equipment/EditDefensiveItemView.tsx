import { allowedResistances, allowedDexterityRestrictions, allowedInitiativeRestrictions, allowedStrengthRequirements } from "@/domain/characters/equipment/Item";
import { Label } from "@/ui/label";
import { allowedItemAttributePenalties } from "@/domain/characters/equipment/Item";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { displayedText } from "@/presentation/translations";

type EditDefensiveItemViewProps = 
{
  defensiveItem: "armors" | "shields";
  index: number;
}

export default function EditDefensiveItemView({ defensiveItem, index }: EditDefensiveItemViewProps)
{
  return (
    <div className="grid auto-rows-min gap-3 px-4">

        <div className="grid auto-rows-min gap-3 px-4 items-center justify-center">

            <Label className="capitalize">{displayedText.resistance}</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                path={`${defensiveItem}.${index}.resistance`}
                items={allowedResistances}
                noLabel
            />

        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className="capitalize">{displayedText.attributePenalty}</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.attributePenalty`}
                    items={allowedItemAttributePenalties}
                    noLabel
                />

            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className="capitalize">{displayedText.strengthRequirement}</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.strengthRequirement`}
                    items={allowedStrengthRequirements}
                    noLabel
                />

            </div>
                
        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className="capitalize">{displayedText.dexterityRestriction}</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.dexterityRestriction`}
                    items={allowedDexterityRestrictions}
                    noLabel
                />

            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label className="capitalize">{displayedText.initiativeRestriction}</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.initiativeRestriction`}
                    items={allowedInitiativeRestrictions}
                    noLabel
                />
                
            </div>

        </div>
    </div>
  )
}