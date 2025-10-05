import { blockValues, Shield } from "@/domain/Character";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { Control } from "react-hook-form";
import EditItemSheet from "@/application/characters/edit/equipment/EditItemSheet";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/ui/accordion";
import ShieldView from "@/application/characters/equipment/ShieldView";
import EditDefensiveItemView from "@/application/characters/edit/equipment/EditDefensiveItemView";
import { Label } from "@/ui/label";
import { SelectFormField } from "@/ui/SelectFormField";

type AccordionWeaponItemProps = 
{
  equipmentFormName: string;
  shield: Shield;
  control: Control<UpsertCharacterEquipmentType>;
  isPending: boolean;
};

export default function EditShieldView({ equipmentFormName, shield, control, isPending }: AccordionWeaponItemProps)
{
    return (
    <AccordionItem value="shield">
        <AccordionTrigger>{shield.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
            <ShieldView shield={shield} />
            <EditShieldSheet equipmentFormName={equipmentFormName} armor={shield} control={control} isPending={isPending} />
        </AccordionContent>
    </AccordionItem>
    );
}

type EditArmorSheetProps = 
{
  equipmentFormName: string;
  armor: Shield;
  control: Control<UpsertCharacterEquipmentType>;
  isPending: boolean;
};

function EditShieldSheet({ equipmentFormName, armor, control, isPending }: EditArmorSheetProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName} 
      item={{ name: armor.name, description: armor.description, type: "shield" }} 
      control={control} 
      isPending={isPending}
    >
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Block</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={`shield.block`}
              control={control}
              items={blockValues}
              noLabel
              />

        </div>

      <EditDefensiveItemView control={control} defensiveItem="shield" />
    </EditItemSheet>
  )
}
