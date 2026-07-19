import { pathToMounts } from "@/domain/characters/equipment/Equipment";
import { Mount } from "@/domain/characters/equipment/Mount";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import MountViewFields from "@/application/common/equipment/Views/MountViewFields";
import MountEditableFields from "@/application/common/equipment/EditSheets/MountEditableFields";
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

type EditMountViewProps =
{
  mount: Mount;
  index: number;
  isImported: boolean;
  isRemoved?: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
};

export default function EditMountView({ index, mount, isImported, isRemoved, onRemove, onRestore }: EditMountViewProps)
{
  return (
    <ItemViewFromEditList
      itemViewFields={<MountViewFields mount={mount} />}
      itemEditSheet={<EditMountSheet index={index} />}
      index={index}
      isImported={isImported}
      isRemoved={isRemoved}
      onRemove={onRemove}
      onRestore={onRestore}
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
