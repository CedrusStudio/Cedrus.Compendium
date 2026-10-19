"use client";

import { displayedText } from '@/common/translations';
import { Badge } from '@/common/components/ui/badge';
import SummaryView from "@/application/common/SummaryView";
import { type Weapon } from '@/domain/characters/equipment/Weapon';
import { toCriticalRangeString, toOffenseString } from '@/domain/characters/combat/Offense';
import { Label } from '@/common/components/ui/label';

type WeaponViewProps =
{
  weapon: Weapon;
}

export default function WeaponViewFields({ weapon }: WeaponViewProps)
{
  const damageBonusString = toOffenseString(weapon.damageBonus);

  return (
    <div className="grid w-full min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">

      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-3">

        <SummaryView entity={weapon} className="min-w-0 [overflow-wrap:anywhere]" />

        <div className='flex flex-wrap gap-2 place-content-center'>
          <Badge variant="outline" className="whitespace-nowrap">
            <span>{toOffenseString(weapon.offense)}</span>
            <Badge variant="secondary" className="whitespace-nowrap">{toCriticalRangeString(weapon.offense)}, {weapon.offense.critical.power >=0 ? "+" : ""}{weapon.offense.critical.power}</Badge>
          </Badge>

          {
            damageBonusString && (
              <Badge variant="outline" className="whitespace-nowrap">
                <span>{damageBonusString}</span>
              </Badge>
            )
          }
        </div>

      </div>

      <div className="flex flex-wrap place-content-center gap-2">

        <Badge variant="outline" className="flex place-content-center pr-2">
          <Label className='justify-center'><span className='first-letter:uppercase'>{displayedText.range}:</span></Label>
          <span>{weapon.range}</span>
        </Badge>

        <Badge variant="outline" className="flex p-2 place-content-center gap-3">
          <p>{weapon.style}</p>
        </Badge>

      </div>
    </div>
  );
};
