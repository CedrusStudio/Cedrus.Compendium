import { WeaponOffense } from '@/domain/Character';
import { Badge } from '@/components/ui/badge';

export default function CriticalView({ weaponOffense }: { weaponOffense: WeaponOffense }) 
{
    const calculatedRange = `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;

    return (
        <div className='flex gap-x-2'>
            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">{calculatedRange}</Badge>
            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-500">+{weaponOffense.critical.power}</Badge>
        </div>
    );
}