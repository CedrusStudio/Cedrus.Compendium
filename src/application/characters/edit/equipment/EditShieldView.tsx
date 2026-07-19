import { pathToShields } from "@/domain/characters/equipment/Equipment";
import { Shield } from "@/domain/characters/equipment/Shield";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import ShieldViewFields from "@/application/common/equipment/Views/ShieldViewFields";
import ShieldEditableFields from "@/application/common/equipment/EditSheets/ShieldEditableFields";
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

type EditShieldViewProps =
{
  shield: Shield;
  index: number;
  isImported: boolean;
  isRemoved?: boolean;
  onRemove?: () => void;
  onRestore?: () => void;
};

export default function EditShieldView({ index, shield, isImported, isRemoved, onRemove, onRestore }: EditShieldViewProps)
{
  return (
    <ItemViewFromEditList
      itemViewFields={<ShieldViewFields shield={shield} />}
      itemEditSheet={<EditShieldSheet index={index} />}
      index={index}
      isImported={isImported}
      isRemoved={isRemoved}
      onRemove={onRemove}
      onRestore={onRestore}
    />
  );
}

type EditShieldSheetProps =
{
  index: number;
};

function EditShieldSheet({ index }: EditShieldSheetProps)
{
  const type = pathToShields(index);

  return (
    <EditCharacterItemSheet type={type} >
      <ShieldEditableFields pathPrefix={type + "."}  />
    </EditCharacterItemSheet>
  )
}
