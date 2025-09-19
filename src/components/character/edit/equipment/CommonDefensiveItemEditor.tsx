import { attributePenaltyValues, dexterityRestrictionValues, initiativeRestrictionValues, strengthRequirementValues } from "@/domain/Character";
import { Control } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { SelectFormField } from "@/components/ui/SelectFormField";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";

type CommonDefensiveItemEditorProps = 
{
  defensiveItem: "armor" | "shield";
  control: Control<UpsertCharacterEquipmentType>;
}

export default function CommonDefensiveItemEditor({ control, defensiveItem }: CommonDefensiveItemEditorProps)
{
  return (
    <div className="grid auto-rows-min gap-3 px-4">

      <Label>Penalty</Label>

      <SelectFormField<UpsertCharacterEquipmentType> 
          name={`${defensiveItem}.attributePenalty`}
          control={control}
          items={attributePenaltyValues}
          noLabel
        />

      <Label>Dexterity Restriction</Label>

      <SelectFormField<UpsertCharacterEquipmentType> 
          name={`${defensiveItem}.dexterityRestriction`}
          control={control}
          items={dexterityRestrictionValues}
          noLabel
        />

      <Label>Initiative Restriction</Label>

      <SelectFormField<UpsertCharacterEquipmentType> 
          name={`${defensiveItem}.initiativeRestriction`}
          control={control}
          items={initiativeRestrictionValues}
          noLabel
        />

      <Label>Strength Requirement</Label>

      <SelectFormField<UpsertCharacterEquipmentType> 
          name={`${defensiveItem}.strengthRequirement`}
          control={control}
          items={strengthRequirementValues}
          noLabel
        />
    </div>
  )
}