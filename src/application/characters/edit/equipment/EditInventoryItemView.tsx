import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Item } from "@/domain/characters/equipment/Item";
import InventoryItemViewFields from "@/application/common/equipment/Views/InventoryItemViewFields";
import { pathToInventory } from "@/domain/characters/equipment/Equipment";
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

type EditInventoryItemViewProps =
{
  inventory: Item;
  index: number;
  isImported: boolean;
  isRemoved?: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
};

export default function EditInventoryItemView({ index, inventory, isImported, isRemoved, onRemove, onRestore }: EditInventoryItemViewProps)
{
  const type = pathToInventory(index);

  return (
    <ItemViewFromEditList
      itemViewFields={<InventoryItemViewFields item={inventory} />}
      itemEditSheet={<EditCharacterItemSheet type={type} />}
      index={index}
      isImported={isImported}
      isRemoved={isRemoved}
      onRemove={onRemove}
      onRestore={onRestore}
    />
  );
}
