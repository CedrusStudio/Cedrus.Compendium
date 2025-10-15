import { Mount } from "@/domain/characters/equipment/Mount";
import { displayedText } from "@/presentation/translations";
import { translate } from "@/presentation/translations";
import { AccordionContent } from "@radix-ui/react-accordion";
import { PropsWithChildren } from "react";

export default function MountView({ horse }: PropsWithChildren<{ horse: Mount }>)
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <div>
        <span className='font-semibold'>{translate("description")}:</span> {horse.description}
      </div>
      <div>
        <span className='font-semibold'>{displayedText.canterSpeed}:</span> {horse.canterSpeed}
      </div>
      <div>
        <span className='font-semibold'>{displayedText.gallopSpeed}:</span> {horse.gallopSpeed}
      </div>
      <div>
        <span className='font-semibold'>{displayedText.paceSpeed}:</span> {horse.paceSpeed}
      </div>
      <div>
        <span className='font-semibold'>{displayedText.horsemanshipBonus}:</span> {horse.horsemanshipBonus}
      </div>
    </AccordionContent>
  );
};