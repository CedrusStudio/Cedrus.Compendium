import { Equipment } from '@/domain/Character';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import WeaponAccordionOverview from '@/components/character/WeaponAccordionOverview';
import ArmorAccordionOverview from '@/components/character/ArmorAccordionOverview';
import ShieldAccordionOverview from '@/components/character/ShieldAccordionOverview';

export default function EquipmentAccordion({ equipment }: { equipment: Equipment })
{
  return (
    <Accordion type="multiple">

        <AccordionItem value="weapon1">
            <AccordionTrigger>{equipment.weapon1.name}</AccordionTrigger>
            <AccordionContent>
              <WeaponAccordionOverview weapon={equipment.weapon1} />
            </AccordionContent>
        </AccordionItem>

        {
          equipment.weapon2 && (
            <AccordionItem value="weapon2">
                <AccordionTrigger>{equipment.weapon2.name}</AccordionTrigger>
                <AccordionContent>
                  <WeaponAccordionOverview weapon={equipment.weapon2} />
                </AccordionContent>
            </AccordionItem>
          )
        }

        {
          equipment.weapon3 && (
            <AccordionItem value="weapon3">
                <AccordionTrigger>{equipment.weapon3.name}</AccordionTrigger>
                <AccordionContent>
                  <WeaponAccordionOverview weapon={equipment.weapon3} />
                </AccordionContent>
            </AccordionItem>
          )
        }

        {
          equipment.weapon4 && (
            <AccordionItem value="weapon4">
                <AccordionTrigger>{equipment.weapon4.name}</AccordionTrigger>
                <AccordionContent>
                  <WeaponAccordionOverview weapon={equipment.weapon4} />
                </AccordionContent>
            </AccordionItem>
          )
        }

        <AccordionItem value="armor">
            <AccordionTrigger>{equipment.armor.name}</AccordionTrigger>
            <AccordionContent>
              <ArmorAccordionOverview armor={equipment.armor} />
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="shield">
            <AccordionTrigger>{equipment.shield.name}</AccordionTrigger>
            <AccordionContent>
              <ShieldAccordionOverview shield={equipment.shield} />
            </AccordionContent>
        </AccordionItem>

        {
          equipment.magicEquipment.map(item => (
            <AccordionItem key={item.name} value={item.name}>
              <AccordionTrigger>{item.name}</AccordionTrigger>
              <AccordionContent>
                {item.description}
              </AccordionContent>
            </AccordionItem>
          ))
        }
    </Accordion>
  );
};
