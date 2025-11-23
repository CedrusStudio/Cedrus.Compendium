import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Item } from "@/domain/characters/equipment/Item";
import InventoryItemViewFields from "@/application/common/equipment/Views/InventoryItemViewFields";
import { useFieldArray } from "react-hook-form";
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import { splitEquipmentItemTypes, pathToInventory } from "@/domain/characters/equipment/Equipment";
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

type EditInventoryItemViewProps = 
{
  inventory: Item;
  index: number;
  isImported: boolean;
};

export default function EditInventoryItemView({ index, inventory, isImported }: EditInventoryItemViewProps)
{
  const type = pathToInventory(index);
  const { name } = splitEquipmentItemTypes(type);
  const { remove } = useFieldArray<EquipmentDto>({ name });

  return (
    <ItemViewFromEditList
      itemViewFields={<InventoryItemViewFields item={inventory} />}
      itemEditSheet={<EditCharacterItemSheet type={type} />}
      index={index}
      isImported={isImported}
      remove={remove}
    />
  );
}
