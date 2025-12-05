"use client";

import { WeaponOffense } from '@/domain/characters/combat/Offense';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import IncreaseButton from '@/common/components/buttons/IncreaseButton';
import DecreaseButton from '@/common/components/buttons/DecreaseButton';
import { leftIcon, rightIcon } from '@/common/icons';

type EditCriticalViewProps = 
{
  weaponOffense: WeaponOffense;
  setRange: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
};

export default function EditCriticalView({ weaponOffense, setRange, setPower }: EditCriticalViewProps) 
{
  const calculatedRange = `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;

  const handleSetRange = (value: React.SetStateAction<number>) =>
  {
    setRange(prev => 
    {
      const newRange = typeof value === 'function' ? (value as (prev: number) => number)(prev) : value;
      return Math.max(0, Math.min(newRange, weaponOffense.grade * 2));
    });
  }

  const handleSetPower = (value: React.SetStateAction<number>) =>
  {
    setPower(prev => 
    {
      const newPower = typeof value === 'function' ? (value as (prev: number) => number)(prev) : value;
      return Math.max(-5, Math.min(newPower, 50));
    });
  }

  return (
    <div className='flex gap-x-1'>

      <div className='flex items-center'>
        <IncreaseButton className='w-auto h-auto p-0' variant='ghost' value={1} setValue={handleSetRange} icon={leftIcon} />
          <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">
            {calculatedRange}
          </Badge>
        <DecreaseButton className='w-auto h-auto p-0' variant='ghost' value={1} setValue={handleSetRange} icon={rightIcon} />
      </div>
      
      <div className='flex items-center'>
          <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-500">
            {weaponOffense.critical.power > 0 ? '+' : ''}{weaponOffense.critical.power}
          </Badge>
          <VerticalChangeButtons setValue={handleSetPower} />
      </div>
      
    </div>
  );
}