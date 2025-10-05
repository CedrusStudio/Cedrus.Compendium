import { blockValues, Shield } from "@/domain/characters/Character";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
import { Control, useFormContext } from "react-hook-form";
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
  isPending: boolean;
};

export default function EditShieldView({ equipmentFormName, shield, isPending }: AccordionWeaponItemProps)
{
    return (
    <AccordionItem value="shield">
        <AccordionTrigger>{shield.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
            <ShieldView shield={shield} />
            <EditShieldSheet equipmentFormName={equipmentFormName} armor={shield} isPending={isPending} />
        </AccordionContent>
    </AccordionItem>
    );
}

type EditArmorSheetProps = 
{
  equipmentFormName: string;
  armor: Shield;
  isPending: boolean;
};

function EditShieldSheet({ equipmentFormName, armor, isPending }: EditArmorSheetProps)
{
  const { control } = useFormContext<UpsertCharacterEquipmentType>();

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
