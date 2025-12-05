import { toOffenseString } from '@/domain/characters/combat/Offense';
import { SpellDamage } from '@/domain/characters/combat/Power';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import RollsView from '@/application/characters/combat/offense/RollsView';
import Subcard from '@/common/components/Subcard';
import { resolveSetState } from '@/common/global/resolveSetState';
import { Dispatch, SetStateAction } from 'react';

type SpellDamageSubcardProps =
{
  name: string;
  spellDamage: SpellDamage;
  baseSpellDamage: SpellDamage;
  rolls: number[];
  setRolls: Dispatch<SetStateAction<number[]>>;
  setDamage: Dispatch<SetStateAction<SpellDamage>>;
  handleReroll: (index: number, damage: SpellDamage, setRolls: Dispatch<SetStateAction<number[]>>) => void;
  resetCallback: () => void;
};

export default function SpellDamageSubcard(input: SpellDamageSubcardProps)
{
  return (
    <Subcard name={input.name} className='min-w-50' callback={input.resetCallback} childrenInfo={<span>{toOffenseString(input.baseSpellDamage)}</span> } > 
      <SpellDamageView 
        spellDamage={input.spellDamage} 
        rolls={input.rolls} 
        onReroll={(index: number, damage: SpellDamage) => input.handleReroll(index, damage, input.setRolls)}
        setAmount={action => input.setDamage(prev => 
        {
          const nextAmount = resolveSetState(action, prev.amount);
          if (nextAmount < 0) return prev;
          return { ...prev, amount: nextAmount };
        })}
        setGrade={action => input.setDamage(prev => 
        {
          const nextGrade = resolveSetState(action, prev.grade);
          if (nextGrade < 1) return prev;
          return { ...prev, grade: nextGrade };
        })}
        setBonus={action => input.setDamage(prev => 
        {
          const nextBonus = resolveSetState(action, prev.bonus);
          return { ...prev, bonus: nextBonus };
        })}
      />
    </Subcard>
  );
};

type SpellDamageViewProps =
{
  spellDamage: SpellDamage;
  rolls: number[];
  onReroll: (index: number, damage: SpellDamage) => void;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
};

function SpellDamageView({ spellDamage, rolls, onReroll, setAmount, setGrade, setBonus }: SpellDamageViewProps)
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex place-items-center'>
        <VerticalChangeButtons setValue={setAmount} />
          <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-green-500">
            {toOffenseString(spellDamage)}
          </Badge>
        <VerticalChangeButtons setValue={setGrade} />
        <VerticalChangeButtons setValue={setBonus} />
      </div>
      <RollsView rolls={rolls} onReroll={index => onReroll(index, spellDamage)} />
    </div>
  )
};
