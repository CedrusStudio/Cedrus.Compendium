import { blockValues, Shield, pathToShieldsField } from "@/domain/characters/Character";
import { UpsertCharacterEquipmentType } from "@/persistence/characterSchemas";
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
  index: number;
};

export default function EditShieldView({ equipmentFormName, index, shield, isPending }: AccordionWeaponItemProps)
{
    return (
    <AccordionItem value="shield">
        <AccordionTrigger>{shield.name}</AccordionTrigger>
        <AccordionContent className='flex flex-row justify-between items-start'>
            <ShieldView shield={shield} />
            <EditShieldSheet equipmentFormName={equipmentFormName} shield={shield} isPending={isPending} index={index} />
        </AccordionContent>
    </AccordionItem>
    );
}

function EditShieldSheet({ equipmentFormName, shield, isPending, index }: AccordionWeaponItemProps)
{
  return (
    <EditItemSheet 
      equipmentFormName={equipmentFormName} 
      item={{ name: shield.name, description: shield.description, type: `shields.${index}` }} 
      isPending={isPending}
    >
        <div className="grid auto-rows-min gap-3 px-4">

          <Label>Block</Label>

          <SelectFormField<UpsertCharacterEquipmentType> 
              name={pathToShieldsField(index, `block`)}
              items={blockValues}
              noLabel
              />

        </div>

      <EditDefensiveItemView defensiveItem="shield" />
    </EditItemSheet>
  )
}
