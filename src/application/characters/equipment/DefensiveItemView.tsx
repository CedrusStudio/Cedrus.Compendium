import { Armor, Shield } from "@/domain/characters/Character";
import { AccordionContent } from "@radix-ui/react-accordion";
import { PropsWithChildren } from "react";

type CommonDefensiveItemOverviewProps = 
{
  defensiveItem: Shield | Armor;
}

export default function DefensiveItemView({ defensiveItem, children }: PropsWithChildren<CommonDefensiveItemOverviewProps>)
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <div>
        <span className='font-semibold'>Opis:</span> {defensiveItem.description}
      </div>
      {children}
      <div>
        <span className='font-semibold'>Kara:</span> {defensiveItem.attributePenalty}
      </div>
      <div>
        <span className='font-semibold'>Ograniczenie Zręczności:</span> {defensiveItem.dexterityRestriction}
      </div>
      <div>
        <span className='font-semibold'>Ograniczenie Inicjatywy:</span> {defensiveItem.initiativeRestriction}
      </div>
      <div>
        <span className='font-semibold'>Wymaganie Siły:</span> {defensiveItem.strengthRequirement}
      </div>
    </AccordionContent>
  )
}