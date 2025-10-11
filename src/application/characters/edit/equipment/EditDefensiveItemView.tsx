import { allowedResistances, allowedDexterityRestrictions, allowedInitiativeRestrictions, allowedStrengthRequirements } from "@/domain/characters/equipment/Item";
import { Label } from "@/ui/label";
import { allowedItemAttributePenalties } from "@/domain/characters/equipment/Item";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";

type EditDefensiveItemViewProps = 
{
  defensiveItem: "armors" | "shields";
  index: number;
}

export default function EditDefensiveItemView({ defensiveItem, index }: EditDefensiveItemViewProps)
{
  return (
    <div className="grid auto-rows-min gap-3 px-4">

        <div className="grid auto-rows-min gap-3 px-4">

            <Label>Odporność</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                path={`${defensiveItem}.${index}.resistance`}
                items={allowedResistances}
                noLabel
            />

        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Kara atrybutu</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.attributePenalty`}
                    items={allowedItemAttributePenalties}
                    noLabel
                />

            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Wymaganie siły</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.strengthRequirement`}
                    items={allowedStrengthRequirements}
                    noLabel
                />

            </div>
                
        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Ograniczenie zręczności</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.dexterityRestriction`}
                    items={allowedDexterityRestrictions}
                    noLabel
                />

            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Ograniczenie inicjatywy</Label>

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