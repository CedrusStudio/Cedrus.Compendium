import { pathToMountsField } from "@/domain/characters/equipment/Equipment";
import { Mount } from "@/domain/characters/equipment/Mount";
import { type EquipmentDto } from "@/persistence/schemas/characters/equipment/equipmentSchema";
import EditCharacterItemSheet from "@/application/characters/edit/equipment/EditCharacterItemSheet";
import { Label } from "@/ui/label";
import MountView from "@/application/characters/equipment/MountView";
import { InputFormField } from "@/common/components/form/InputFormField";
import { displayedText } from "@/presentation/translations";
import ImportedBadge from "@/common/components/labels/ImportedBadge";

type EditMountViewProps = 
{
  mount: Mount;
  index: number;
  isImported: boolean;
};

export default function EditMountView({ index, mount, isImported}: EditMountViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <div className="flex items-center">
        <MountView horse={mount} />
        <ImportedBadge isImported={isImported} />
      </div>
      {!isImported && <EditMountSheet mount={mount} index={index} />}
    </div>
  );
}

type EditMountSheetProps = Pick<EditMountViewProps, 'mount' | 'index'>;

function EditMountSheet({ mount, index }: EditMountSheetProps)
{
  return (
    <EditCharacterItemSheet item={{ name: mount.name, description: mount.description, type: `mounts.${index}` }} >

      <div className="grid auto-rows-min gap-3 px-4 justify-center">

        <Label className="capitalize">{displayedText.pace}</Label>

        <InputFormField<EquipmentDto> 
          path={pathToMountsField(index, `paceSpeed`)}
          inputPlaceholder={displayedText.changePace}
        />

      </div>

      <div className="grid auto-rows-min gap-3 px-4 justify-center">

        <Label className="capitalize">{displayedText.gallop}</Label>

        <InputFormField<EquipmentDto> 
          path={pathToMountsField(index, `gallopSpeed`)}
          inputPlaceholder={displayedText.changeGallop}
        />
          
      </div>

      <div className="grid auto-rows-min gap-3 px-4 justify-center">

        <Label className="capitalize">{displayedText.canter}</Label>

        <InputFormField<EquipmentDto> 
            path={pathToMountsField(index, `canterSpeed`)}
            inputPlaceholder={displayedText.changeCanter}
        />
          
      </div>

      <div className="grid auto-rows-min gap-3 px-4 justify-center">

        <Label className="first-letter:capitalize">{displayedText.horsemanshipBonus}</Label>

        <InputFormField<EquipmentDto> 
          path={pathToMountsField(index, `horsemanshipBonus`)}
          inputPlaceholder={displayedText.changeHorsemanshipBonus}
        />
          
      </div>

    </EditCharacterItemSheet>
  )
}