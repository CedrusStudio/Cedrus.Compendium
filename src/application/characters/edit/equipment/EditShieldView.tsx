import { pathToShields } from "@/domain/characters/equipment/Equipment";
import { Shield } from "@/domain/characters/equipment/Shield";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import ShieldView from "@/application/characters/equipment/ShieldView";
import ImportedBadge from "@/common/components/labels/ImportedBadge";
import ShieldEditableFields from "@/application/common/equipment/ShieldEditableFields";

type EditShieldViewProps = 
{
  shield: Shield;
  index: number;
  isImported: boolean;
};

export default function EditShieldView({ index, shield, isImported }: EditShieldViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <div className="flex items-center">
        <ShieldView shield={shield} />
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
