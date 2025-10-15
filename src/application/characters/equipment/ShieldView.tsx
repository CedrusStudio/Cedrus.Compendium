import { Shield } from "@/domain/characters/equipment/Shield";
import { AccordionContent } from "@radix-ui/react-accordion";
import DefensiveItemView from "@/application/characters/equipment/DefensiveItemView";
import { displayedText } from "@/presentation/translations";

export default function ShieldView({ shield }: { shield: Shield })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <DefensiveItemView defensiveItem={shield}>
        <div>
          <span className='font-semibold capitalize'>{displayedText.block}:</span> {shield.block}
        </div>
      </DefensiveItemView>
    </AccordionContent>
  )
}