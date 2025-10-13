import { DamageOffense, toOffenseString } from '@/domain/characters/combat/Offense';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';

type DamageBonusViewProps =
{
  damageOffense: DamageOffense;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
}

export default function DamageBonusView({ damageOffense, setAmount, setGrade, setBonus }: DamageBonusViewProps) 
{
  return (
    <div className='flex items-center'>
      <VerticalChangeButtons setValue={setAmount} />
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
          {toOffenseString(damageOffense)}
        </Badge>
      <VerticalChangeButtons setValue={setGrade} />
      <VerticalChangeButtons setValue={setBonus} />
    </div>
  );
}
