import { getWeaponDamageString, WeaponOffense } from '@/domain/characters/Character';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';

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
    <div className='flex items-center'>
      <VerticalChangeButtons setValue={setAmount} />
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
        {getWeaponDamageString(weaponOffense)}
      </Badge>
      <VerticalChangeButtons setValue={setGrade} />
      <VerticalChangeButtons setValue={setBonus} />
    </div>
  );
}