import { pathToShieldsField } from "@/domain/characters/equipment/Equipment";
import { allowedBlocks, Shield } from "@/domain/characters/equipment/Shield";
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import ShieldView from "@/application/characters/equipment/ShieldView";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";
import { Label } from "@/ui/label";
import { SelectFormField } from "@/common/components/form/SelectFormField";
import { displayedText } from "@/presentation/translations";
import ImportedBadge from "@/common/components/labels/ImportedBadge";

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
      {!isImported && <EditShieldSheet shield={shield} index={index} />}
    </div>
  );
}

type EditShieldSheetProps = Pick<EditShieldViewProps, 'shield' | 'index'>;

function EditShieldSheet({ shield, index }: EditShieldSheetProps)
{
  return (
    <EditItemSheet item={{ name: shield.name, description: shield.description, type: `shields.${index}` }} >

        <div className="grid auto-rows-min gap-3 justify-center items-center">

          <Label className="capitalize">{displayedText.block}</Label>

          <SelectFormField<EquipmentDto> 
            path={pathToShieldsField(index, `block`)}
            items={allowedBlocks}
            noLabel
            />

        </div>

      <EditDefensiveItemView defensiveItem="shields" index={index} />
    </EditItemSheet>
  )
}
