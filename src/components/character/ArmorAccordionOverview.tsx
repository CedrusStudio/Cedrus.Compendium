import { Armor } from "@/domain/Character";
import { AccordionContent } from "@radix-ui/react-accordion";

export default function ArmorAccordionOverview({ armor }: { armor: Armor })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <div>
        <span className='font-semibold'>Opis:</span> {armor.description}
      </div>
      <div>
        <span className='font-semibold'>Pancerz:</span> {armor.protection}
      </div>
      <div>
        <span className='font-semibold'>Kara:</span> {armor.attributePenalty}
      </div>
      <div>
        <span className='font-semibold'>Ograniczenie Zręczności:</span> {armor.dexterityRestriction}
      </div>
      <div>
        <span className='font-semibold'>Ograniczenie Inicjatywy:</span> {armor.initiativeRestriction}
      </div>
      <div>
        <span className='font-semibold'>Wymaganie Siły:</span> {armor.strengthRequirement}
      </div>
    </AccordionContent>
  )
}