import { Mount } from "@/domain/characters/equipment/Mount";
import { AccordionContent } from "@radix-ui/react-accordion";
import { PropsWithChildren } from "react";

export default function HorseView({ horse }: PropsWithChildren<{ horse: Mount }>)
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <div>
        <span className='font-semibold'>Opis:</span> {horse.description}
      </div>
      <div>
        <span className='font-semibold'>Prędkość cwału:</span> {horse.canterSpeed}
      </div>
      <div>
        <span className='font-semibold'>Prędkość galopu:</span> {horse.gallopSpeed}
      </div>
      <div>
        <span className='font-semibold'>Prędkość kłusa:</span> {horse.paceSpeed}
      </div>
      <div>
        <span className='font-semibold'>Bonus jeździectwa:</span> {horse.horsemanshipBonus}
      </div>
    </AccordionContent>
  );
};