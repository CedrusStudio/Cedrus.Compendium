import { pathToMounts, splitEquipmentItemTypes } from "@/domain/characters/equipment/Equipment";
import { Mount } from "@/domain/characters/equipment/Mount";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import MountViewFields from "@/application/common/equipment/Views/MountViewFields";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import MountEditableFields from "@/application/common/equipment/EditSheets/MountEditableFields";
import { useFieldArray } from "react-hook-form";
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import RemoveFromArrayButton from "@/common/components/form/RemoveFromArrayButton";

type EditMountViewProps = 
{
  mount: Mount;
  index: number;
  isImported: boolean;
};

export default function EditMountView({ index, mount, isImported}: EditMountViewProps)
{
  const type = pathToMounts(index);
  const { name } = splitEquipmentItemTypes(type);
  const { remove } = useFieldArray<EquipmentDto>({ name });

  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <MountViewFields mount={mount} />
        <ImportedBadge isImported={isImported} />
      </div>
      <div className="flex justify-end items-center gap-3">
        <RemoveFromArrayButton remove={remove} index={index} />
        {!isImported && <EditMountSheet index={index} />}
      </div>
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