import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Item } from "@/domain/characters/equipment/Item";
import { displayedText } from "@/presentation/translations";
import ImportedBadge from "@/common/components/labels/ImportedBadge";

type EditInventoryItemViewProps = 
{
  inventory: Item;
  index: number;
  isImported: boolean;
};

export default function EditInventoryItemView({ index, inventory, isImported }: EditInventoryItemViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <div className="flex items-center">
        <span>{displayedText.description}: {inventory.description}</span>
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditCharacterItemSheet type={`inventory.${index}`} />}
    </div>
  );
}
