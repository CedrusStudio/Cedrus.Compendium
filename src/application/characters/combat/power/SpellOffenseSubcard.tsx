import { resolveSetState } from "@/common/global/resolveSetState";
import { Dispatch, SetStateAction } from "react";
import RollsView from "@/application/characters/combat/offense/RollsView";
import { toCriticalRangeString, toOffenseString } from '@/domain/characters/combat/Offense';
import { SpellOffense } from '@/domain/characters/combat/Power';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import IncreaseButton from '@/common/components/buttons/IncreaseButton';
import DecreaseButton from '@/common/components/buttons/DecreaseButton';
import { leftIcon, rightIcon } from '@/common/icons';
import Subcard from "@/common/components/Subcard";

type SpellOffenseSubcardProps =
{
  name: string;
  spellOffense: SpellOffense;
  baseSpellOffense: SpellOffense;
  rolls: [number, boolean][];
  setRolls: Dispatch<SetStateAction<[number, boolean][]>>;
  setOffense: Dispatch<SetStateAction<SpellOffense>>;
  handleReroll: (index: number, offense: SpellOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>) => void;
  resetCallback: () => void;
};

export function SpellOffenseSubcard(input: SpellOffenseSubcardProps)
{
  return (
    <Subcard className='min-w-60' name={input.name} callback={input.resetCallback} childrenInfo={<BaseSpellOffenseInfoView spellOffense={input.baseSpellOffense} />}>
      <SpellOffenseView
        spellOffense={input.spellOffense}
        rolls={input.rolls}
        setRolls={input.setRolls}
        setOffense={input.setOffense}
        handleReroll={input.handleReroll}
      />
    </Subcard>
  )
}

function BaseSpellOffenseInfoView({ spellOffense }: { spellOffense: SpellOffense })
{
  return (
    <div className='flex flex-row gap-3'>
      <span className='font-normal text-lg'>{toOffenseString(spellOffense)}</span> 
      <span className='font-normal text-lg'>{toCriticalRangeString(spellOffense)}, +{spellOffense.critical.power}</span>
    </div>
  );
}

type SpellOffenseViewProps =
{
  spellOffense: SpellOffense;
  rolls: [number, boolean][];
  setRolls: React.Dispatch<React.SetStateAction<[number, boolean][]>>;
  setOffense: React.Dispatch<React.SetStateAction<SpellOffense>>;
  handleReroll: (rollIndex: number, offense: SpellOffense, setRolls: Dispatch<SetStateAction<[number, boolean][]>>) => void;
};

function SpellOffenseView(input: SpellOffenseViewProps)
{
  return (
    <SpellOffenseWithCriticalAndRolls 
      spellOffense={input.spellOffense} 
      rolls={input.rolls} 
      onReroll={(index: number, offense: SpellOffense) => input.handleReroll(index, offense, input.setRolls)}
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

type SpellOffenseWithCriticalAndRollsProps =
{
  spellOffense: SpellOffense;
  rolls: [number, boolean][];
  onReroll: (index: number, offense: SpellOffense) => void;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
  setRange: React.Dispatch<React.SetStateAction<number>>;
};

function SpellOffenseWithCriticalAndRolls({ spellOffense, rolls, onReroll, setPower, setRange, setAmount, setGrade, setBonus }: SpellOffenseWithCriticalAndRollsProps)
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex place-items-center gap-x-3'>
        <SpellOffenseDamageView spellOffense={spellOffense} setAmount={setAmount} setGrade={setGrade} setBonus={setBonus} />
      </div>
      <CriticalView spellOffense={spellOffense} setPower={setPower} setRange={setRange} />
      <RollsView rolls={rolls} onReroll={index => onReroll(index, spellOffense)} />
    </div>
  )
};

type SpellOffenseDamageViewProps =
{
  spellOffense: SpellOffense;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
}

function SpellOffenseDamageView({ spellOffense, setAmount, setGrade, setBonus }: SpellOffenseDamageViewProps) 
{
  return (
    <div className='flex items-center'>
      <VerticalChangeButtons setValue={setAmount} />
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-blue-500">
        {toOffenseString(spellOffense)}
      </Badge>
      <VerticalChangeButtons setValue={setGrade} />
      <VerticalChangeButtons setValue={setBonus} />
    </div>
  );
}

type CriticalViewProps = 
{
  spellOffense: SpellOffense;
  setRange: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
};

export default function CriticalView({ spellOffense, setRange, setPower }: CriticalViewProps) 
{
  return (
    <div className='flex gap-x-1'>

      <div className='flex items-center'>
        <IncreaseButton className='w-auto h-auto p-0' variant='ghost' value={1} setValue={setRange} icon={leftIcon} />
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">
            {toCriticalRangeString(spellOffense)}
        </Badge>
        <DecreaseButton className='w-auto h-auto p-0' variant='ghost' value={1} setValue={setRange} icon={rightIcon} />
      </div>
      
      <div className='flex place-items-center'>
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-500">
            {spellOffense.critical.power > 0 ? '+' : ''}{spellOffense.critical.power}
        </Badge>
        <VerticalChangeButtons setValue={setPower} />
      </div>
        
    </div>
  );
}
