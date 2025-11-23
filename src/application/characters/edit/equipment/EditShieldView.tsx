import { pathToShields, splitEquipmentItemTypes } from "@/domain/characters/equipment/Equipment";
import { Shield } from "@/domain/characters/equipment/Shield";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import ShieldViewFields from "@/application/common/equipment/Views/ShieldViewFields";
import ShieldEditableFields from "@/application/common/equipment/EditSheets/ShieldEditableFields";
import { useFieldArray } from "react-hook-form";
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import ItemViewFromEditList from '@/application/characters/edit/equipment/ItemViewFromEditList';

type EditShieldViewProps = 
{
  shield: Shield;
  index: number;
  isImported: boolean;
};

export default function EditShieldView({ index, shield, isImported }: EditShieldViewProps)
{
  const type = pathToShields(index);
  const { name } = splitEquipmentItemTypes(type);
  const { remove } = useFieldArray<EquipmentDto>({ name });

  return (
    <ItemViewFromEditList
      itemViewFields={<ShieldViewFields shield={shield} />}
      itemEditSheet={<EditShieldSheet index={index} />}
      index={index}
      isImported={isImported}
      remove={remove}
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
