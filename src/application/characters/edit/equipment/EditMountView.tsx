import { pathToMountsField } from "@/domain/characters/equipment/Equipment";
import { Mount } from "@/domain/characters/equipment/Mount";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import { Label } from "@/ui/label";
import MountView from "@/application/characters/equipment/MountView";
import { InputFormField } from "@/common/components/form/InputFormField";
import { translate } from "@/presentation/translations";

type EditMountViewProps = 
{
  mount: Mount;
  index: number;
};

export default function EditMountView({ index, mount}: EditMountViewProps)
{
  return (
    <div className="flex flex-row justify-between items-start">
      <MountView horse={mount} />
      <EditMountSheet mount={mount} index={index} />
    </div>
  );
}

function EditMountSheet({ mount, index }: EditMountViewProps)
{
  return (
    <EditItemSheet item={{ name: mount.name, description: mount.description, type: `mounts.${index}` }} >

      <div className="grid auto-rows-min gap-3 px-4 justify-center">

        <Label className="capitalize">{translate("pace")}</Label>

        <InputFormField<UpsertCharacterEquipmentType> 
          path={pathToMountsField(index, `paceSpeed`)}
          inputPlaceholder={translate("changePace")}
        />

      </div>

      <div className="grid auto-rows-min gap-3 px-4 justify-center">

        <Label className="capitalize">{translate("gallop")}</Label>

        <InputFormField<UpsertCharacterEquipmentType> 
          path={pathToMountsField(index, `gallopSpeed`)}
          inputPlaceholder={translate("changeGallop")}
        />
          
      </div>

      <div className="grid auto-rows-min gap-3 px-4 justify-center">

        <Label className="capitalize">{translate("canter")}</Label>

        <InputFormField<UpsertCharacterEquipmentType> 
            path={pathToMountsField(index, `canterSpeed`)}
            inputPlaceholder={translate("changeCanter")}
        />
          
      </div>

      <div className="grid auto-rows-min gap-3 px-4 justify-center">

        <Label className="first-letter:capitalize">{translate("horsemanshipBonus")}</Label>

        <InputFormField<UpsertCharacterEquipmentType> 
          path={pathToMountsField(index, `horsemanshipBonus`)}
          inputPlaceholder={translate("changeHorsemanshipBonus")}
        />
          
      </div>

    </EditItemSheet>
  )
}