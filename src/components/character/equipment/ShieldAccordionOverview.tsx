import { Shield } from "@/domain/Character";
import { AccordionContent } from "@radix-ui/react-accordion";
import CommonDefensiveItemOverview from "@/components/character/equipment/CommonDefensiveItemOverview";

export default function ShieldAccordionOverview({ shield }: { shield: Shield })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <CommonDefensiveItemOverview defensiveItem={shield}>
        <div>
          <span className='font-semibold'>Blok:</span> {shield.block}
        </div>
      </CommonDefensiveItemOverview>
    </AccordionContent>
  )
}