import { pathToMountsField } from "@/domain/characters/equipment/Equipment";
import { Mount } from "@/domain/characters/equipment/Mount";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import { Label } from "@/ui/label";
import HorseView from "@/application/characters/equipment/HorseView";
import { InputFormField } from "@/common/components/form/InputFormField";

type EditMountViewProps = 
{
  mount: Mount;
  index: number;
};

export default function EditMountView({ index, mount}: EditMountViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <HorseView horse={mount} />
      <EditMountSheet mount={mount} index={index} />
    </div>
  );
}

function EditMountSheet({ mount, index }: EditMountViewProps)
{
  return (
    <EditItemSheet item={{ name: mount.name, description: mount.description, type: `mounts.${index}` }} >
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Kłus</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
            path={pathToMountsField(index, `paceSpeed`)}
            inputPlaceholder="edytuj kłus..."
          />

        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Galop</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
            path={pathToMountsField(index, `gallopSpeed`)}
            inputPlaceholder="edytuj galop..."
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Cwał</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
              path={pathToMountsField(index, `canterSpeed`)}
              inputPlaceholder="edytuj cwał..."
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Bonus do jeździectwa</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
              path={pathToMountsField(index, `horsemanshipBonus`)}
              inputPlaceholder="edytuj bonus do jeździectwa..."
          />
            
        </div>

    </EditItemSheet>
  )
}