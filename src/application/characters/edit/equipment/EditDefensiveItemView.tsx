import { attributePenaltyValues, dexterityRestrictionValues, initiativeRestrictionValues, strengthRequirementValues } from "@/domain/characters/Character";
import { Label } from "@/ui/label";
import { SelectFormField } from "@/ui/SelectFormField";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";

type CommonDefensiveItemEditorProps = 
{
  defensiveItem: "armors" | "shields";
  index: number;
}

export default function EditDefensiveItemView({ defensiveItem, index }: CommonDefensiveItemEditorProps)
{
  return (
    <div className="grid auto-rows-min gap-3 px-4">

        <div className="grid auto-rows-min gap-3 px-4">

            <Label>Kara atrybutu</Label>

            <SelectFormField<UpsertCharacterEquipmentType> 
                path={`${defensiveItem}.${index}.resistance`}
                items={attributePenaltyValues}
                noLabel
            />
        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Kara atrybutu</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.attributePenalty`}
                    items={attributePenaltyValues}
                    noLabel
                />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Wymaganie siły</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.strengthRequirement`}
                    items={strengthRequirementValues}
                    noLabel
                />
            </div>
                
        </div>

        <div className="flex flex-row gap-3 px-14">

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Ograniczenie zręczności</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.dexterityRestriction`}
                    items={dexterityRestrictionValues}
                    noLabel
                />
            </div>

            <div className="grid auto-rows-min gap-3 px-4">

                <Label>Ograniczenie inicjatywy</Label>

                <SelectFormField<UpsertCharacterEquipmentType> 
                    path={`${defensiveItem}.${index}.initiativeRestriction`}
                    items={initiativeRestrictionValues}
                    noLabel
                />
            </div>

        </div>
    </div>
  )
}