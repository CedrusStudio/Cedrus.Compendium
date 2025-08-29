
import { Armor, Equipment, Shield, Weapon } from '@/domain/Character';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function EquipmentAccordion({ equipment }: { equipment: Equipment })
{
  return (
    <Accordion type="single" collapsible>

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

function WeaponAccordionOverview({ weapon }: { weapon: Weapon }) 
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
    {
      weapon.description && (
        <div>
          <span className="font-semibold">Description:</span> {weapon.description}
        </div>
      )
    }
    {
      weapon.style && (
        <div>
          <span className="font-semibold">Style:</span> {weapon.style}
        </div>
      )
    }
    {
      weapon.range && (
        <div>
          <span className="font-semibold">Range:</span> {weapon.range}
        </div>
      )
    }
    {
      weapon.offense && (
        <div>
          <WeaponOverview weapon={weapon} />
        </div>
      )
    }
    </AccordionContent>
  );
}

function WeaponOverview({ weapon }: { weapon: Weapon }) 
{
   const weaponOffense = weapon.offense.amount === 1 
            ? `(k${weapon.offense.grade * 2}+${weapon.offense.bonus})`
            : `${weapon.offense.amount}(k${weapon.offense.grade * 2}+${weapon.offense.bonus})`

    const damageOffense = weapon.damageBonus.amount === 1 
            ? `k${weapon.damageBonus.grade * 2}+${weapon.damageBonus.bonus}`
            : weapon.damageBonus.amount === 0
              ? `${weapon.damageBonus.bonus}`
              : `${weapon.damageBonus.amount}(k${weapon.damageBonus.grade * 2}+${weapon.damageBonus.bonus})`

    const criticalDamageBonus = weapon.offense.critical.power
    const criticalRangeBonus = weapon.offense.critical.range;

    return (
      <div className='flex flex-col'>
        <div>
          <span className='font-semibold'>Damage: </span>
          <span>{weaponOffense}+{damageOffense}</span>
        </div>

        <div>
          <span className='font-semibold'>Critical: </span>
          <span>
              range: {criticalRangeBonus}, damage: {criticalDamageBonus}
          </span>
        </div>
      </div>
    );
}

function ArmorAccordionOverview({ armor }: { armor: Armor })
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

function ShieldAccordionOverview({ shield }: { shield: Shield })
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
      <div>
        <span className='font-semibold'>Description:</span> {shield.description}
      </div>
      <div>
        <span className='font-semibold'>Protection:</span> {shield.protection}
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