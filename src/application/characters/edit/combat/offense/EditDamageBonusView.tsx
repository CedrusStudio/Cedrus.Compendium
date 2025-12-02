"use client";

import { DamageOffense, toOffenseString } from '@/domain/characters/combat/Offense';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import { Checkbox } from '@/common/components/ui/checkbox';

type EditDamageBonusViewProps =
{
  damageOffense: DamageOffense;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
  setIsPhantom: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function EditDamageBonusView({ damageOffense, setAmount, setGrade, setBonus, setIsPhantom }: EditDamageBonusViewProps) 
{
  const handleSetAmount = (value: React.SetStateAction<number>) =>
  {
    setAmount(prev => 
    {
      const newAmount = typeof value === 'function' ? (value as (prev: number) => number)(prev) : value;
      return Math.max(0, newAmount);
    });
  }

  const handleSetGrade = (value: React.SetStateAction<number>) =>
  {
    setGrade(prev => 
    {
      const newGrade = typeof value === 'function' ? (value as (prev: number) => number)(prev) : value;
      return Math.max(1, newGrade);
    });
  }

  return (
    <div className='flex items-center'>
      <VerticalChangeButtons setValue={handleSetAmount} />
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-blue-500">
          {toOffenseString(damageOffense)}
        </Badge>
      <VerticalChangeButtons setValue={handleSetGrade} />
      <VerticalChangeButtons setValue={setBonus} />
      <Checkbox checked={damageOffense.isPhantom} onCheckedChange={() => setIsPhantom(prev => !prev)} />
  </div>
  );
}