import { DamageOffense } from '@/domain/Character';
import { Badge } from '@/components/ui/badge';
import VerticalChangeButtons from '@/components/buttons/VerticalChangeButtons';

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
    <div className='flex gap-x-1'>

        <div className='flex items-center'>
          <VerticalChangeButtons setValue={setAmount} />
            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
              {damageOffense.amount}k{damageOffense.grade * 2}+{damageOffense.bonus}
            </Badge>
          <VerticalChangeButtons setValue={setGrade} />
          <VerticalChangeButtons setValue={setBonus} />
        </div>
        
    </div>
  );
}
