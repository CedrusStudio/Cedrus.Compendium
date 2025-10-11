import { Armor } from "@/domain/characters/equipment/Armor";
import { AccordionContent } from "@radix-ui/react-accordion";
import DefensiveItemView from "@/application/characters/equipment/DefensiveItemView";

export default function ArmorView({ armor }: { armor: Armor })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <DefensiveItemView defensiveItem={armor}>
        <div>
          <span className='font-semibold'>Niewrażliwość:</span> {armor.immunity}
        </div>
        <div>
          <span className='font-semibold'>Pancerz:</span> {armor.protection}
        </div>
      </DefensiveItemView>
    </AccordionContent>
  )
}