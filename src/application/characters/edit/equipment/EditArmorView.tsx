import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import { Label } from "@/ui/label";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import ArmorView from "@/application/characters/equipment/ArmorView";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { Armor, allowedProtections } from "@/domain/characters/equipment/Armor";
import { pathToArmorsField } from "@/domain/characters/equipment/Equipment";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";
import { displayedText } from "@/presentation/translations";
import ImportedBadge from "@/common/components/labels/ImportedBadge";

type EditArmorViewProps = 
{
  armor: Armor;
  index: number;
  isImported: boolean;
};

export default function EditArmorView({ index, armor, isImported }: EditArmorViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <div className="flex items-center">
        <ArmorView armor={armor} />
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditArmorSheet armor={armor} index={index} /> }
    </div>
  );
}

type EditArmorSheetProps = 
{
  armor: Armor;
  index: number;
};

function EditArmorSheet({ armor, index }: EditArmorSheetProps)
{
  return (
    <EditCharacterItemSheet item={{ name: armor.name, description: armor.description, type: `armors.${index}` }} >
      <div className="grid auto-rows-min gap-3 justify-center items-center">

        <Label className="capitalize">{displayedText.protection}</Label>

        <SelectFormField<EquipmentDto> 
          path={pathToArmorsField(index, `protection`)}
          items={allowedProtections}
          noLabel
        />

      </div>

      <EditDefensiveItemView defensiveItem="armors" index={index} />
    </EditCharacterItemSheet>
  )
}