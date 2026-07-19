import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Armor } from "@/domain/characters/equipment/Armor";
import { pathToArmors } from "@/domain/characters/equipment/Equipment";
import ArmorEditableFields from "@/application/common/equipment/EditSheets/ArmorEditableFields";
import ArmorViewFields from "@/application/common/equipment/Views/ArmorViewFields";
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

type EditArmorViewProps =
{
  armor: Armor;
  index: number;
  isImported: boolean;
  isRemoved?: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
};

export default function EditArmorView({ index, armor, isImported, isRemoved, onRemove, onRestore }: EditArmorViewProps)
{
  return (
    <ItemViewFromEditList
      itemViewFields={<ArmorViewFields armor={armor} />}
      itemEditSheet={<EditArmorSheet index={index} />}
      index={index}
      isImported={isImported}
      isRemoved={isRemoved}
      onRemove={onRemove}
      onRestore={onRestore}
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
