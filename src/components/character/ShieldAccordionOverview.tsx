import { Shield } from "@/domain/Character";
import { AccordionContent } from "@radix-ui/react-accordion";

export default function ShieldAccordionOverview({ shield }: { shield: Shield })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <div>
        <span className='font-semibold'>Description:</span> {shield.description}
      </div>
      <div>
        <span className='font-semibold'>Block:</span> {shield.block}
      </div>
      <div>
        <span className='font-semibold'>Penalty:</span> {shield.attributePenalty}
      </div>
      <div>
        <span className='font-semibold'>Dexterity Restriction:</span> {shield.dexterityRestriction}
      </div>
      <div>
        <span className='font-semibold'>Initiative Restriction:</span> {shield.initiativeRestriction}
      </div>
      <div>
        <span className='font-semibold'>Strength Requirement:</span> {shield.strengthRequirement}
      </div>
    </AccordionContent>
  )
}