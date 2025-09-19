import { Weapon } from "@/domain/Character";
import { AccordionContent } from "@radix-ui/react-accordion";

export default function WeaponAccordionOverview({ weapon }: { weapon: Weapon }) 
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
              : `${weapon.damageBonus.amount}k${weapon.damageBonus.grade * 2}+${weapon.damageBonus.bonus}`

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