import { WeaponOffense } from '@/domain/Character';
import { Badge } from '@/components/ui/badge';
import VerticalChangeButtons from '@/components/global/buttons/VerticalChangeButtons';

type WeaponDamageViewProps =
{
  weaponOffense: WeaponOffense;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
  setGrade: React.Dispatch<React.SetStateAction<number>>;
  setBonus: React.Dispatch<React.SetStateAction<number>>;
}

export default function WeaponDamageView({ weaponOffense, setAmount, setGrade, setBonus }: WeaponDamageViewProps) 
{
  return (
    <div className='flex gap-x-1'>

      <div className='flex items-center'>
        <VerticalChangeButtons setValue={setAmount} />
        <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
          {weaponOffense.amount}(k{weaponOffense.grade * 2}+{weaponOffense.bonus})
        </Badge>
        <VerticalChangeButtons setValue={setGrade} />
        <VerticalChangeButtons setValue={setBonus} />
      </div>
        
    </div>
  );
}