import { pathToMounts } from "@/domain/characters/equipment/Equipment";
import { Mount } from "@/domain/characters/equipment/Mount";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import MountViewFields from "@/application/common/equipment/Views/MountViewFields";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import MountEditableFields from "@/application/common/equipment/EditSheets/MountEditableFields";

type EditMountViewProps = 
{
  mount: Mount;
  index: number;
  isImported: boolean;
};

export default function EditMountView({ index, mount, isImported}: EditMountViewProps)
{
  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <MountViewFields mount={mount} />
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditMountSheet index={index} />}
    </div>
  );
}

type EditMountSheetProps =
{
  index: number;
};

function EditMountSheet({ index }: EditMountSheetProps)
{
  const type = pathToMounts(index);

  return (
    <EditCharacterItemSheet type={type} >
      <MountEditableFields pathPrefix={type + "."} />
    </EditCharacterItemSheet>
  )
}