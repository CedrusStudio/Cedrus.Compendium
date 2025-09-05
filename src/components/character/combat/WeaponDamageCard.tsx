import { WeaponOffense } from '@/domain/Character';
import { Badge } from '@/components/ui/badge';

export default function WeaponDamageView({ weaponOffense }: { weaponOffense: WeaponOffense }) 
{
    return (
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
        {weaponOffense.amount}(k{weaponOffense.grade * 2}+{weaponOffense.bonus})
      </Badge>
    );
}