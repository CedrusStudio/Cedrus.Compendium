import { attributePenaltyValues, dexterityRestrictionValues, initiativeRestrictionValues, strengthRequirementValues } from "@/domain/characters/Character";
import { Label } from "@/ui/label";
import { SelectFormField } from "@/ui/SelectFormField";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";

type CommonDefensiveItemEditorProps = 
{
  defensiveItem: "armor" | "shield";
}

export default function EditDefensiveItemView({ defensiveItem }: CommonDefensiveItemEditorProps)
{
  return (
    <div className="grid auto-rows-min gap-3 px-4">

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Kara atrybutu</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    name={`${defensiveItem}.attributePenalty`}
                    items={attributePenaltyValues}
                    noLabel
                />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Wymaganie siły</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    name={`${defensiveItem}.strengthRequirement`}
                    items={strengthRequirementValues}
                    noLabel
                />
            </div>
                
        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Ograniczenie zręczności</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    name={`${defensiveItem}.dexterityRestriction`}
                    items={dexterityRestrictionValues}
                    noLabel
                />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Ograniczenie inicjatywy</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    name={`${defensiveItem}.initiativeRestriction`}
                    items={initiativeRestrictionValues}
                    noLabel
                />
            </div>

        </div>
    </div>
  )
}