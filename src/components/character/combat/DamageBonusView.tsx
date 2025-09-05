import { DamageOffense } from '@/domain/Character';
import { Badge } from '@/components/ui/badge';

export default function DamageBonusView({ damageOffense }: { damageOffense: DamageOffense }) 
{
    return (
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
        {damageOffense.amount}k{damageOffense.grade * 2}+{damageOffense.bonus}
      </Badge>
    );
}
