import { toCriticalRangeString, toOffenseString } from "@/domain/characters/combat/Offense";
import { Weapon } from "@/domain/characters/equipment/Weapon";
import { displayedText } from "@/presentation/translations";
import { AccordionContent } from "@radix-ui/react-accordion";

export default function WeaponView({ weapon }: { weapon: Weapon }) 
{
  return (
    <AccordionContent className='flex flex-col gap-2'>
    {
      weapon.description && (
        <div>
          <span className="font-semibold capitalize">{displayedText.description}:</span> {weapon.description}
        </div>
      )
    }
    {
      weapon.style && (
        <div>
          <span className="font-semibold capitalize">{displayedText.style}:</span> {weapon.style}
        </div>
      )
    }
    {
      weapon.range && (
        <div>
          <span className="font-semibold capitalize">{displayedText.range}:</span> {weapon.range}
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
  return (
    <div className='flex flex-col'>
      <div>
        <span className='font-semibold capitalize'>{displayedText.damage}: </span>
        <span>{toOffenseString(weapon.offense)}+{toOffenseString(weapon.damageBonus)}</span>
      </div>

      <div>
        <span className='font-semibold capitalize'>{displayedText.critical}: </span>
        <span>{toCriticalRangeString(weapon.offense)}, +{weapon.offense.critical.power}</span>
      </div>
    </div>
  );
}