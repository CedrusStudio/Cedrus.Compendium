import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { Label } from "@/ui/label"
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import ArmorView from "@/application/characters/equipment/ArmorView";
import { SelectFormField } from "@/ui/SelectFormField";
import { Armor, pathToArmorsField, protectionValues } from "@/domain/characters/Character";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";

type EditArmorViewProps = 
{
  equipmentFormName: string;
  armor: Armor;
  isPending: boolean;
  index: number;
};

export default function EditArmorView({ equipmentFormName, index, armor, isPending }: EditArmorViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <ArmorView armor={armor} />
      <EditArmorSheet equipmentFormName={equipmentFormName} armor={armor} isPending={isPending} index={index} />
    </div>
  );
}

function EditArmorSheet({ equipmentFormName, armor, isPending, index }: EditArmorViewProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName} 
      item={{ name: armor.name, description: armor.description, type: `armors.${index}` }} 
      isPending={isPending}
    >
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