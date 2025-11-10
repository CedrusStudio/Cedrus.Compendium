import { pathToShields } from "@/domain/characters/equipment/Equipment";
import { Shield } from "@/domain/characters/equipment/Shield";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import ShieldViewFields from "@/application/common/equipment/Views/ShieldViewFields";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import ShieldEditableFields from "@/application/common/equipment/EditSheets/ShieldEditableFields";

type EditShieldViewProps = 
{
  shield: Shield;
  index: number;
  isImported: boolean;
};

export default function EditShieldView({ index, shield, isImported }: EditShieldViewProps)
{
  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-2 flex-1">
        <ShieldViewFields shield={shield} />
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditShieldSheet index={index} />}
    </div>
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
