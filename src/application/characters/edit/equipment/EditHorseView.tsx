import { Mount, pathToMountField } from "@/domain/characters/Character";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import { Label } from "@/ui/label";
import HorseView from "@/application/characters/equipment/HorseView";
import { InputFormField } from "@/common/components/form/InputFormField";

type EditHorseViewProps = 
{
  horse: Mount;
  index: number;
};

export default function EditHorseView({ index, horse}: EditHorseViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <HorseView horse={horse} />
      <EditHorseSheet horse={horse} index={index} />
    </div>
  );
}

function EditHorseSheet({ horse, index }: EditHorseViewProps)
{
  return (
    <EditItemSheet item={{ name: horse.name, description: horse.description, type: `horses.${index}` }} >
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Kłus</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
            path={pathToMountField(index, `paceSpeed`)}
            inputPlaceholder="edytuj kłus..."
          />

        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Galop</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
            path={pathToMountField(index, `gallopSpeed`)}
            inputPlaceholder="edytuj galop..."
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Cwał</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
              path={pathToMountField(index, `canterSpeed`)}
              inputPlaceholder="edytuj cwał..."
          />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Bonus do jeździectwa</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
              path={pathToMountField(index, `horsemanshipBonus`)}
              inputPlaceholder="edytuj bonus do jeździectwa..."
          />
            
        </div>

    </EditItemSheet>
  )
}