import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Item } from "@/domain/characters/equipment/Item";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import InventoryItemViewFields from "@/application/common/equipment/Views/InventoryItemViewFields";
import { useFieldArray } from "react-hook-form";
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";
import { splitEquipmentItemTypes, pathToInventory } from "@/domain/characters/equipment/Equipment";

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
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <InventoryItemViewFields item={inventory} />
        <ImportedBadge isImported={isImported} />
      </div>
      <div className="flex justify-end items-center gap-3">
        <RemoveFromArrayButton remove={remove} index={index} />
        {!isImported && <EditCharacterItemSheet type={type} />}
      </div>
    </div>
  );
}
