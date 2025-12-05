import { DamageOffense, toOffenseString } from '@/domain/characters/combat/Offense';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import RollsView from '@/application/characters/combat/offense/RollsView';
import Subcard from '@/common/components/Subcard';
import { resolveSetState } from '@/common/global/resolveSetState';

type DamageBonusSubcardViewProps =
{
  damageBonus: DamageOffense;
  currentDamageBonus: DamageOffense;
  damageBonusRolls: number[];
  handleDamageOffenseReroll: (index: number, damageBonus: DamageOffense, setRolls: React.Dispatch<React.SetStateAction<number[]>>) => void;
  setCurrentDamageBonus: React.Dispatch<React.SetStateAction<DamageOffense>>;
  setDamageBonusRolls: React.Dispatch<React.SetStateAction<number[]>>;
}

export default function DamageBonusSubcard({ damageBonus, currentDamageBonus, damageBonusRolls, handleDamageOffenseReroll, setCurrentDamageBonus, setDamageBonusRolls }: DamageBonusSubcardViewProps)
{
  return (
    <Subcard name='Bonus' className='col-span-3' callback={() => setCurrentDamageBonus(damageBonus)} childrenInfo={<span>{toOffenseString(damageBonus)}</span> } > 
      <DamageBonusView 
        damageOffense={currentDamageBonus} 
        rolls={damageBonusRolls} 
        onReroll={(index: number, damageBonus: DamageOffense) => handleDamageOffenseReroll(index, damageBonus, setDamageBonusRolls)}
        setAmount={action => setCurrentDamageBonus(prev => 
        {
          const nextAmount = resolveSetState(action, prev.amount);
          if (nextAmount < 0) return prev;
          return { ...prev, amount: nextAmount };
        })}
        setGrade={action => setCurrentDamageBonus(prev => 
        {
          const nextGrade = resolveSetState(action, prev.grade);
          if (nextGrade < 1) return prev;
          return { ...prev, grade: nextGrade };
        })}
        setBonus={action => setCurrentDamageBonus(prev => 
        {
          const nextBonus = resolveSetState(action, prev.bonus);
          return { ...prev, bonus: nextBonus };
        })}
      />
    </Subcard>
  );
};

type DamageBonusViewProps =
{
  damageOffense: DamageOffense;
  rolls: number[];
  onReroll: (index: number, damageBonus: DamageOffense) => void;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
};

function DamageBonusView({ damageOffense, rolls, onReroll, setAmount, setGrade, setBonus }: DamageBonusViewProps)
{
  return (
    <div className='flex flex-col items-center gap-y-3'>
      <div className='flex place-items-center'>
        <VerticalChangeButtons setValue={setAmount} />
          <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-blue-500">
            {toOffenseString(damageOffense)}
          </Badge>
        <VerticalChangeButtons setValue={setGrade} />
        <VerticalChangeButtons setValue={setBonus} />
      </div>
      <RollsView rolls={rolls} onReroll={index => onReroll(index, damageOffense)} />
    </div>
  )
};

