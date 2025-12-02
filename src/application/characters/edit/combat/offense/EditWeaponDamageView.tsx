"use client";

import { WeaponOffense, toOffenseString } from '@/domain/characters/combat/Offense';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import { Checkbox } from '@/common/components/ui/checkbox';

type EditWeaponDamageViewProps =
{
  weaponOffense: WeaponOffense;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
  setIsPhantom: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditWeaponDamageView({ weaponOffense, setAmount, setGrade, setBonus, setIsPhantom }: EditWeaponDamageViewProps) 
{
  return (
    <div className='flex items-center'>
      <VerticalChangeButtons setValue={setAmount} />
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
        {toOffenseString(weaponOffense)}
      </Badge>

      <VerticalChangeButtons setValue={setGrade} />
      <VerticalChangeButtons setValue={setBonus} />
      <Checkbox checked={weaponOffense.isPhantom} onCheckedChange={() => setIsPhantom(prev => !prev)} />
    </div>
  );
}