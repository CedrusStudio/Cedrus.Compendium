import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Armor } from "@/domain/characters/equipment/Armor";
import { pathToArmors, splitEquipmentItemTypes } from "@/domain/characters/equipment/Equipment";
import ArmorEditableFields from "@/application/common/equipment/EditSheets/ArmorEditableFields";
import ArmorViewFields from "@/application/common/equipment/Views/ArmorViewFields";
import { useFieldArray } from "react-hook-form";
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

type EditArmorViewProps = 
{
  armor: Armor;
  index: number;
  isImported: boolean;
};

export default function EditArmorView({ index, armor, isImported }: EditArmorViewProps)
{
  const type = pathToArmors(index);
  const { name } = splitEquipmentItemTypes(type);
  const { remove } = useFieldArray<EquipmentDto>({ name });

  return (
    <ItemViewFromEditList
      itemViewFields={<ArmorViewFields armor={armor} />}
      itemEditSheet={<EditArmorSheet index={index} />}
      index={index}
      isImported={isImported}
      remove={remove}
    />
  );
}

type EditArmorSheetProps = 
{
  index: number;
};

function EditArmorSheet({ index }: EditArmorSheetProps)
{
  const type = pathToArmors(index);

  return (
    <EditCharacterItemSheet type={type} >
      <ArmorEditableFields pathPrefix={type + "."}  />
    </EditCharacterItemSheet>
  )
}