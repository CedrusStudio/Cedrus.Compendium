import { blockValues, Shield, pathToShieldsField } from "@/domain/characters/Character";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import ShieldView from "@/application/characters/equipment/ShieldView";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";
import { Label } from "@/ui/label";
import { SelectFormField } from "@/ui/SelectFormField";

type EditShieldViewProps = 
{
  equipmentFormName: string;
  shield: Shield;
  isPending: boolean;
  index: number;
};

export default function EditShieldView({ equipmentFormName, index, shield, isPending }: EditShieldViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <ShieldView shield={shield} />
      <EditShieldSheet equipmentFormName={equipmentFormName} shield={shield} isPending={isPending} index={index} />
    </div>
  );
}

function EditShieldSheet({ equipmentFormName, shield, isPending, index }: EditShieldViewProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName} 
      item={{ name: shield.name, description: shield.description, type: `shields.${index}` }} 
      isPending={isPending}
    >
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Block</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              path={pathToShieldsField(index, `block`)}
              items={blockValues}
              noLabel
              />

        </div>

      <EditDefensiveItemView defensiveItem="shields" index={index} />
    </EditItemSheet>
  )
}
