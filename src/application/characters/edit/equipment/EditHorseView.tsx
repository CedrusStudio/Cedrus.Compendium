import { Horse, pathToHorseField } from "@/domain/characters/Character";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import { Label } from "@/ui/label";
import HorseView from "@/application/characters/equipment/HorseView";
import { InputFormField } from "@/common/components/ui/InputFormField";

type EditHorseViewProps = 
{
  equipmentFormName: string;
  horse: Horse;
  isPending: boolean;
  index: number;
};

export default function EditHorseView({ equipmentFormName, index, horse, isPending }: EditHorseViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <HorseView horse={horse} />
      <EditHorseSheet equipmentFormName={equipmentFormName} horse={horse} isPending={isPending} index={index} />
    </div>
  );
}

function EditHorseSheet({ equipmentFormName, horse, isPending, index }: EditHorseViewProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName} 
      item={{ name: horse.name, description: horse.description, type: `horses.${index}` }} 
      isPending={isPending}
    >
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Kłus</Label>

          <InputFormField<UpsertCharacterEquipmentType> 
              path={pathToHorseField(index, `paceSpeed`)}
              inputPlaceholder="edytuj kłus..."
          />

        </div>

        <div className="grid auto-rows-min gap-3 px-4">

            <Label>Galop</Label>

            <InputFormField<UpsertCharacterEquipmentType> 
                path={pathToHorseField(index, `gallopSpeed`)}
                inputPlaceholder="edytuj galop..."
            />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

            <Label>Cwał</Label>

            <InputFormField<UpsertCharacterEquipmentType> 
                path={pathToHorseField(index, `canterSpeed`)}
                inputPlaceholder="edytuj cwał..."
            />
            
        </div>

        <div className="grid auto-rows-min gap-3 px-4">

            <Label>Bonus do jeździectwa</Label>

            <InputFormField<UpsertCharacterEquipmentType> 
                path={pathToHorseField(index, `horsemanshipBonus`)}
                inputPlaceholder="edytuj bonus do jeździectwa..."
            />
            
        </div>

    </EditItemSheet>
  )
}