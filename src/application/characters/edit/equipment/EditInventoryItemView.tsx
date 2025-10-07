import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import { Item } from "@/domain/characters/Character";

type EditInventoryItemViewProps = 
{
  equipmentFormName: string;
  inventory: Item;
  isPending: boolean;
  index: number;
};

export default function EditInventoryItemView({ equipmentFormName, index, inventory, isPending }: EditInventoryItemViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <span>Opis: {inventory.description}</span>
      <EditInventorySheet equipmentFormName={equipmentFormName} inventory={inventory} isPending={isPending} index={index} />
    </div>
  );
}

function EditInventorySheet({ equipmentFormName, inventory, isPending, index }: EditInventoryItemViewProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName} 
      item={{ name: inventory.name, description: inventory.description, type: `inventory.${index}` }} 
      isPending={isPending}
      index={index}
    />
  )
}
