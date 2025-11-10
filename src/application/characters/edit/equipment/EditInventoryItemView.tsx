import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Item } from "@/domain/characters/equipment/Item";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import InventoryItemViewFields from "@/application/common/equipment/Views/InventoryItemViewFields";

type EditInventoryItemViewProps = 
{
  inventory: Item;
  index: number;
  isImported: boolean;
};

export default function EditInventoryItemView({ index, inventory, isImported }: EditInventoryItemViewProps)
{
  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <InventoryItemViewFields item={inventory} />
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditCharacterItemSheet type={`inventory.${index}`} />}
    </div>
  );
}
