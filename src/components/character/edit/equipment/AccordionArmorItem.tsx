import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import { Label } from "@/components/ui/label"
import EditItemSheet from "@/components/character/edit/equipment/EditItemSheet";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ArmorAccordionOverview from "@/components/character/equipment/ArmorAccordionOverview";
import { SelectFormField } from "@/components/ui/SelectFormField";
import { Armor, protectionValues } from "@/domain/Character";
import CommonDefensiveItemEditor from "@/components/character/edit/equipment/CommonDefensiveItemEditor";

type AccordionWeaponItemProps = 
{
  equipmentFormName: string;
  armor: Armor;
  control: Control<UpsertCharacterEquipmentType>;
  isPending: boolean;
};

export default function AccordionArmorItem({ equipmentFormName, armor, control, isPending }: AccordionWeaponItemProps)
{
    return (
    <AccordionItem value="armor">
        <AccordionTrigger>{armor.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
            <ArmorAccordionOverview armor={armor} />
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

      <CommonDefensiveItemEditor control={control} defensiveItem="armor" />
    </EditItemSheet>
  )
}