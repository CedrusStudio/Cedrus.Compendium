import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import ArmorView from "@/application/characters/equipment/ArmorView";
import { Armor } from "@/domain/characters/equipment/Armor";
import { pathToArmors } from "@/domain/characters/equipment/Equipment";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import ArmorEditableFields from "@/application/common/equipment/ArmorEditableFields";

type EditArmorViewProps = 
{
  armor: Armor;
  index: number;
  isImported: boolean;
};

export default function EditArmorView({ index, armor, isImported }: EditArmorViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <div className="flex items-center">
        <ArmorView armor={armor} />
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditArmorSheet armor={armor} index={index} /> }
    </div>
  );
}

type EditArmorSheetProps = 
{
  armor: Armor;
  index: number;
};

function EditArmorSheet({ armor, index }: EditArmorSheetProps)
{
  const type = pathToArmors(index);

  return (
    <EditCharacterItemSheet item={{ name: armor.name, description: armor.description, type }} >
      <ArmorEditableFields pathPrefix={type + "."}  />
    </EditCharacterItemSheet>
  )
}