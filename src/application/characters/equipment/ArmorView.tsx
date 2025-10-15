import { Armor } from "@/domain/characters/equipment/Armor";
import { AccordionContent } from "@radix-ui/react-accordion";
import DefensiveItemView from "@/application/characters/equipment/DefensiveItemView";
import { translate } from "@/presentation/translations";

export default function ArmorView({ armor }: { armor: Armor })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <DefensiveItemView defensiveItem={armor}>
        <div>
          <span className='font-semibold capitalize'>{translate("immunity")}:</span> {armor.immunity}
        </div>
        <div>
          <span className='font-semibold capitalize'>{translate("protection")}:</span> {armor.protection}
        </div>
      </DefensiveItemView>
    </AccordionContent>
  )
}