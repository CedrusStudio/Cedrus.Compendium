import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { Label } from "@/ui/label"
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import ArmorView from "@/application/characters/equipment/ArmorView";
import { SelectFormField } from "@/ui/SelectFormField";
import { Armor, pathToArmorsField, protectionValues } from "@/domain/characters/Character";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";

type AccordionWeaponItemProps = 
{
  equipmentFormName: string;
  armor: Armor;
  isPending: boolean;
  index: number;
};

export default function EditArmorView({ equipmentFormName, index, armor, isPending }: AccordionWeaponItemProps)
{
    return (
    <AccordionItem value="armor">
        <AccordionTrigger>{armor.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
            <ArmorView armor={armor} />
            <EditArmorSheet equipmentFormName={equipmentFormName} armor={armor} isPending={isPending} index={index} />
        </AccordionContent>
    </AccordionItem>
    );
}

function EditArmorSheet({ equipmentFormName, armor, isPending, index }: AccordionWeaponItemProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName} 
      item={{ name: armor.name, description: armor.description, type: `armors.${index}` }} 
      isPending={isPending}
    >
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Pancerz</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={pathToArmorsField(index, `protection`)}
              items={protectionValues}
              noLabel
            />

        </div>

      <EditDefensiveItemView defensiveItem="armor" />
    </EditItemSheet>
  )
}