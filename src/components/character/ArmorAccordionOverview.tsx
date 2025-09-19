import { Armor } from "@/domain/Character";
import { AccordionContent } from "@radix-ui/react-accordion";

export default function ArmorAccordionOverview({ armor }: { armor: Armor })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <div>
        <span className='font-semibold'>Description:</span> {armor.description}
      </div>
      <div>
        <span className='font-semibold'>Protection:</span> {armor.protection}
      </div>
      <div>
        <span className='font-semibold'>Penalty:</span> {armor.attributePenalty}
      </div>
      <div>
        <span className='font-semibold'>Dexterity Restriction:</span> {armor.dexterityRestriction}
      </div>
      <div>
        <span className='font-semibold'>Initiative Restriction:</span> {armor.initiativeRestriction}
      </div>
      <div>
        <span className='font-semibold'>Strength Requirement:</span> {armor.strengthRequirement}
      </div>
    </AccordionContent>
  )
}