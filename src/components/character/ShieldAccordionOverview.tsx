import { Shield } from "@/domain/Character";
import { AccordionContent } from "@radix-ui/react-accordion";

export default function ShieldAccordionOverview({ shield }: { shield: Shield })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <div>
        <span className='font-semibold'>Opis:</span> {shield.description}
      </div>
      <div>
        <span className='font-semibold'>Blok:</span> {shield.block}
      </div>
      <div>
        <span className='font-semibold'>Kara:</span> {shield.attributePenalty}
      </div>
      <div>
        <span className='font-semibold'>Ograniczenie Zręczności:</span> {shield.dexterityRestriction}
      </div>
      <div>
        <span className='font-semibold'>Ograniczenie Inicjatywy:</span> {shield.initiativeRestriction}
      </div>
      <div>
        <span className='font-semibold'>Wymaganie Siły:</span> {shield.strengthRequirement}
      </div>
    </AccordionContent>
  )
}