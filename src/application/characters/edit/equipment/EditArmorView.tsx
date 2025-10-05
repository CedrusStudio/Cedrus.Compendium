import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { Label } from "@/ui/label"
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import ArmorView from "@/application/characters/equipment/ArmorView";
import { SelectFormField } from "@/ui/SelectFormField";
import { Armor, protectionValues } from "@/domain/characters/Character";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";

type AccordionWeaponItemProps = 
{
  equipmentFormName: string;
  armor: Armor;
  control: Control<UpsertCharacterEquipmentType>;
  isPending: boolean;
};

export default function EditArmorView({ equipmentFormName, armor, control, isPending }: AccordionWeaponItemProps)
{
    return (
    <AccordionItem value="armor">
        <AccordionTrigger>{armor.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
            <ArmorView armor={armor} />
            <EditArmorSheet equipmentFormName={equipmentFormName} armor={armor} control={control} isPending={isPending} />
        </AccordionContent>
    </AccordionItem>
    );
}
function EditArmorSheet({ equipmentFormName, armor, control, isPending }: AccordionWeaponItemProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName} 
      item={{ name: armor.name, description: armor.description, type: "armor" }} 
      control={control} 
      isPending={isPending}
    >
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Pancerz</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`armor.protection`}
              control={control}
              items={protectionValues}
              noLabel
              />

        </div>

      <EditDefensiveItemView control={control} defensiveItem="armor" />
    </EditItemSheet>
  )
}