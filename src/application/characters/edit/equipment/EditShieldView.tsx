import { pathToShieldsField } from "@/domain/characters/equipment/Equipment";
import { allowedBlocks, Shield } from "@/domain/characters/equipment/Shield";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import ShieldView from "@/application/characters/equipment/ShieldView";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";
import { Label } from "@/ui/label";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { translate } from "@/domain/data/translations";

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

        <div className="grid auto-rows-min gap-3 justify-center items-center">

          <Label className="capitalize">{translate("block")}</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
            path={pathToShieldsField(index, `block`)}
            items={allowedBlocks}
            noLabel
            />

        </div>

      <EditDefensiveItemView defensiveItem="shields" index={index} />
    </EditItemSheet>
  )
}
