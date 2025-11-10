import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Armor } from "@/domain/characters/equipment/Armor";
import { pathToArmors } from "@/domain/characters/equipment/Equipment";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import ArmorEditableFields from "@/application/common/equipment/EditSheets/ArmorEditableFields";
import ArmorViewFields from "@/application/common/equipment/Views/ArmorViewFields";

type EditArmorViewProps = 
{
  armor: Armor;
  index: number;
  isImported: boolean;
};

export default function EditArmorView({ index, armor, isImported }: EditArmorViewProps)
{
  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <ArmorViewFields armor={armor} />
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditArmorSheet index={index} /> }
    </div>
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