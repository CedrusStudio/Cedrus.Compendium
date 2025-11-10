"use client";

import { displayedText } from '@/presentation/translations';
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
  return (
    <div className='flex flex-row place-items-center justify-between w-full gap-4'>

      <div className='flex flex-row place-items-center gap-3'>

        <SummaryView entity={weapon} />

        <Badge variant="outline">
          <span>{toOffenseString(weapon.offense)}</span>
          <Badge variant="secondary">{toCriticalRangeString(weapon.offense)}, +{weapon.offense.critical.power}</Badge>
        </Badge>

        <Badge variant="outline">
          <span>{toOffenseString(weapon.damageBonus)}</span>
        </Badge>

      </div>

        <div className="flex flex-row place-content-center gap-2">

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