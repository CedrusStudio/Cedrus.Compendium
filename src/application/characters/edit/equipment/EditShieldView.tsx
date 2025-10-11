import { blockValues, Shield, pathToShieldsField } from "@/domain/characters/Character";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import ShieldView from "@/application/characters/equipment/ShieldView";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";
import { Label } from "@/ui/label";
import { SelectFormField } from "@/common/components/form/SelectFormField";

type EditShieldViewProps = 
{
  shield: Shield;
  index: number;
};

export default function EditShieldView({ index, shield }: EditShieldViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <ShieldView shield={shield} />
      <EditShieldSheet shield={shield} index={index} />
    </div>
  );
}

function EditShieldSheet({ shield, index }: EditShieldViewProps)
{
  return (
    <EditItemSheet item={{ name: shield.name, description: shield.description, type: `shields.${index}` }} >
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
