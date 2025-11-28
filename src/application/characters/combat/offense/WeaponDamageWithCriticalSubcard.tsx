import { resolveSetState } from "@/common/global/resolveSetState";
import { Dispatch, SetStateAction } from "react";
import RollsView from "@/application/characters/combat/offense/RollsView";
import { toCriticalRangeString, WeaponOffense, toOffenseString } from '@/domain/characters/combat/Offense';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import IncreaseButton from '@/common/components/buttons/IncreaseButton';
import DecreaseButton from '@/common/components/buttons/DecreaseButton';
import { leftIcon, rightIcon } from '@/presentation/icons';
import Subcard from "@/common/components/Subcard";

type WeaponDamageWithCriticalSubcardProps =
{
  name: string;
  weaponOffense: WeaponOffense;
  baseWeaponOffense: WeaponOffense;
  rolls: [number, boolean][];
  setRolls: React.Dispatch<React.SetStateAction<[number, boolean][]>>;
  setOffense: React.Dispatch<React.SetStateAction<WeaponOffense>>;
  handleWeaponReroll: (rollIndex: number, offense: WeaponOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>) => void;
  resetCallback: () => void;
};

export function WeaponDamageWithCriticalSubcard(input: WeaponDamageWithCriticalSubcardProps)
{
  return (
    <Subcard className='col-span-3' name={input.name} callback={input.resetCallback} childrenInfo={<BaseWeaponDamageInfoView weaponOffense={input.baseWeaponOffense} />}>
      <WeaponDamageWithCriticalView
        weaponOffense={input.weaponOffense}
        rolls={input.rolls}
        setRolls={input.setRolls}
        setOffense={input.setOffense}
        handleWeaponReroll={input.handleWeaponReroll}
      />
    </Subcard>
  )
}

function BaseWeaponDamageInfoView({ weaponOffense }: { weaponOffense: WeaponOffense })
{
  return (
    <div className='flex flex-row gap-3'>
      <span>{toOffenseString(weaponOffense)}</span> 
      <span>{toCriticalRangeString(weaponOffense)}, +{weaponOffense.critical.power}</span>
    </div>
  );
}

type WeaponDamageWithCriticalViewProps =
{
  weaponOffense: WeaponOffense;
  rolls: [number, boolean][];
  setRolls: React.Dispatch<React.SetStateAction<[number, boolean][]>>;
  setOffense: React.Dispatch<React.SetStateAction<WeaponOffense>>;
  handleWeaponReroll: (rollIndex: number, offense: WeaponOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>) => void;
};

function WeaponDamageWithCriticalView(input: WeaponDamageWithCriticalViewProps)
{
  return (
    <WeaponDamageWithCriticalAndRolls 
      weaponOffense={input.weaponOffense} 
      rolls={input.rolls} 
      onReroll={(index: number, offense: WeaponOffense) => input.handleWeaponReroll(index, offense, input.setRolls)}
      setPower={action => input.setOffense(prev => 
      {
        const nextPower = resolveSetState(action, prev.critical.power);
        return { ...prev, critical: { ...prev.critical, power: nextPower } };
      })}
      setRange={action => input.setOffense(prev => 
      {
        const nextRange = resolveSetState(action, prev.critical.range);
        if (nextRange < -1 || nextRange > prev.grade * 2) return prev;
        return { ...prev, critical: { ...prev.critical, range: nextRange } };
      })}
      setAmount={action => input.setOffense(prev => 
      {
        const nextAmount = resolveSetState(action, prev.amount);
        if (nextAmount < 0) return prev;
        return { ...prev, amount: nextAmount };
      })}
      setGrade={action => input.setOffense(prev => 
      {
        const nextGrade = resolveSetState(action, prev.grade);
        if (nextGrade < 1) return prev;
        return { ...prev, grade: nextGrade };
      })}
      setBonus={action => input.setOffense(prev => 
      {
        const nextBonus = resolveSetState(action, prev.bonus);
        return { ...prev, bonus: nextBonus };
      })}
    />
  )
}

type WeaponDamageWithCriticalAndRollsProps =
{
  weaponOffense: WeaponOffense;
  rolls: [number, boolean][];
  onReroll: (index: number, offense: WeaponOffense) => void;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
  setRange: React.Dispatch<React.SetStateAction<number>>;
};

function WeaponDamageWithCriticalAndRolls({ weaponOffense, rolls, onReroll, setPower, setRange, setAmount, setGrade, setBonus }: WeaponDamageWithCriticalAndRollsProps)
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex place-items-center gap-x-3'>
        <WeaponDamageView weaponOffense={weaponOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
      </div>
      <CriticalView weaponOffense={weaponOffense} setPower={setPower} setRange={setRange} />
      <RollsView rolls={rolls} onReroll={index => onReroll(index, weaponOffense)} />
    </div>
  )
};

type WeaponDamageViewProps =
{
  weaponOffense: WeaponOffense;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
}

function WeaponDamageView({ weaponOffense, setAmount, setGrade, setBonus }: WeaponDamageViewProps) 
{
  return (
    <div className='flex items-center'>
      <VerticalChangeButtons setValue={setAmount} />
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
        {toOffenseString(weaponOffense)}
      </Badge>
      <VerticalChangeButtons setValue={setGrade} />
      <VerticalChangeButtons setValue={setBonus} />
    </div>
  );
}

type CriticalViewProps = 
{
  weaponOffense: WeaponOffense;
  setRange: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
};

export default function CriticalView({ weaponOffense, setRange, setPower }: CriticalViewProps) 
{
  return (
    <div className='flex gap-x-1'>

      <div className='flex items-center'>
        <IncreaseButton className='w-auto h-auto p-0' variant='ghost' value={1} setValue={setRange} icon={leftIcon} />
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">
            {toCriticalRangeString(weaponOffense)}
        </Badge>
        <DecreaseButton className='w-auto h-auto p-0' variant='ghost' value={1} setValue={setRange} icon={rightIcon} />
      </div>
      
      <div className='flex place-items-center'>
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-500">
            {weaponOffense.critical.power > 0 ? '+' : ''}{weaponOffense.critical.power}
        </Badge>
        <VerticalChangeButtons setValue={setPower} />
      </div>
        
    </div>
  );
}