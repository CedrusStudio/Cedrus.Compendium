import { pathToMounts, splitEquipmentItemTypes } from "@/domain/characters/equipment/Equipment";
import { Mount } from "@/domain/characters/equipment/Mount";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import MountViewFields from "@/application/common/equipment/Views/MountViewFields";
import MountEditableFields from "@/application/common/equipment/EditSheets/MountEditableFields";
import { useFieldArray } from "react-hook-form";
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

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
    <ItemViewFromEditList
      itemViewFields={<MountViewFields mount={mount} />}
      itemEditSheet={<EditMountSheet index={index} />}
      index={index}
      isImported={isImported}
      remove={remove}
    />
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