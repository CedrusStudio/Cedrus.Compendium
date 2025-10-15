import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import { Item } from "@/domain/characters/equipment/Item";
import { translate } from "@/presentation/translations";

type EditInventoryItemViewProps = 
{
  inventory: Item;
  index: number;
};

export default function EditInventoryItemView({ index, inventory }: EditInventoryItemViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <span>{translate("description")}: {inventory.description}</span>
      <EditInventorySheet inventory={inventory} index={index} />
    </div>
  );
}

function EditInventorySheet({ inventory, index }: EditInventoryItemViewProps)
{
  return <EditItemSheet item={{ name: inventory.name, description: inventory.description, type: `inventory.${index}` }} />;
}
