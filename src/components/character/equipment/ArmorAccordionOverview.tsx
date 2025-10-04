import { Armor } from "@/domain/Character";
import { AccordionContent } from "@radix-ui/react-accordion";
import CommonDefensiveItemOverview from "@/components/character/equipment/CommonDefensiveItemOverview";

export default function ArmorAccordionOverview({ armor }: { armor: Armor })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <CommonDefensiveItemOverview defensiveItem={armor}>
        <div>
          <span className='font-semibold'>Pancerz:</span> {armor.protection}
        </div>
    </CommonDefensiveItemOverview>
    </AccordionContent>
  )
}