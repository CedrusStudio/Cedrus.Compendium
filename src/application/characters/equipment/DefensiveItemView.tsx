import { Armor } from "@/domain/characters/equipment/Armor";
import { Shield } from "@/domain/characters/equipment/Shield";
import { displayedText } from "@/presentation/translations";

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
        <span className='font-semibold capitalize'>{displayedText.description}:</span> {defensiveItem.description}
      </div>
      {children}
      <div>
        <span className='font-semibold capitalize'>{displayedText.resistance}:</span> {defensiveItem.resistance}
      </div>
      <div>
        <span className='font-semibold capitalize'>{displayedText.penalty}:</span> {defensiveItem.attributePenalty}
      </div>
      <div>
        <span className='font-semibold capitalize'>{displayedText.dexterityRestriction}:</span> {defensiveItem.dexterityRestriction}
      </div>
      <div>
        <span className='font-semibold capitalize'>{displayedText.initiativeRestriction}:</span> {defensiveItem.initiativeRestriction}
      </div>
      <div>
        <span className='font-semibold capitalize'>{displayedText.strengthRequirement}:</span> {defensiveItem.strengthRequirement}
      </div>
    </AccordionContent>
  )
}