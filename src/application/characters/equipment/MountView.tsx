import { Mount } from "@/domain/characters/equipment/Mount";
import { namingConventions } from "@/presentation/namingConventions";
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
        <span className='font-semibold'>{namingConventions.canterSpeed}:</span> {horse.canterSpeed}
      </div>
      <div>
        <span className='font-semibold'>{namingConventions.gallopSpeed}:</span> {horse.gallopSpeed}
      </div>
      <div>
        <span className='font-semibold'>{namingConventions.paceSpeed}:</span> {horse.paceSpeed}
      </div>
      <div>
        <span className='font-semibold'>{namingConventions.horsemanshipBonus}:</span> {horse.horsemanshipBonus}
      </div>
    </AccordionContent>
  );
};