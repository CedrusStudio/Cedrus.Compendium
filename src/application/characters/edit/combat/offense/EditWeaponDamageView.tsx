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
  const handleSetAmount = (value: React.SetStateAction<number>) =>
  {
    setAmount(prev =>
    {
      const next = typeof value === 'function' ? (value as (p: number) => number)(prev) : value;
      return Math.max(0, next);
    });
  };

  const handleSetGrade = (value: React.SetStateAction<number>) =>
  {
    setGrade(prev =>
    {
      const next = typeof value === 'function' ? (value as (p: number) => number)(prev) : value;
      return Math.max(1, next);
    });
  };

  return (
    <div className='flex items-center'>
      <VerticalChangeButtons setValue={handleSetAmount} />
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
        {toOffenseString(weaponOffense)}
      </Badge>

      <VerticalChangeButtons setValue={handleSetGrade} />
      <VerticalChangeButtons setValue={setBonus} />
      <Checkbox checked={weaponOffense.isPhantom} onCheckedChange={() => setIsPhantom(prev => !prev)} />
    </div>
  );
}