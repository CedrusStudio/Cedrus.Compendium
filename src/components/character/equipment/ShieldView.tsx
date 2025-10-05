import { Shield } from "@/domain/Character";
import { AccordionContent } from "@radix-ui/react-accordion";
import DefensiveItemView from "@/components/character/equipment/DefensiveItemView";

export default function ShieldView({ shield }: { shield: Shield })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <DefensiveItemView defensiveItem={shield}>
        <div>
          <span className='font-semibold'>Blok:</span> {shield.block}
        </div>
      </DefensiveItemView>
    </AccordionContent>
  )
}