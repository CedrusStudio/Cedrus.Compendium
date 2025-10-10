import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { Label } from "@/ui/label"
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import ArmorView from "@/application/characters/equipment/ArmorView";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { Armor, pathToArmorsField, protectionValues } from "@/domain/characters/Character";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";

type EditArmorViewProps = 
{
  armor: Armor;
  index: number;
};

export default function EditArmorView({ index, armor }: EditArmorViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <ArmorView armor={armor} />
      <EditArmorSheet armor={armor} index={index} />
    </div>
  );
}

function EditArmorSheet({ armor, index }: EditArmorViewProps)
{
  return (
    <EditItemSheet item={{ name: armor.name, description: armor.description, type: `armors.${index}` }} >
      <div className="grid auto-rows-min gap-3 px-4">

        <Label>Pancerz</Label>

        <SelectFormField<UpsertCharacterEquipmentType> 
          path={pathToArmorsField(index, `protection`)}
          items={protectionValues}
          noLabel
        />

      </div>

      <EditDefensiveItemView defensiveItem="armors" index={index} />
    </EditItemSheet>
  )
}