import { WeaponOffense } from '@/domain/Character';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function WeaponDamageCard({ name, offense, className }: { name: string, offense: WeaponOffense, className?: string })
{
  return (
    <Card className={className}>
        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>{name}</CardTitle>
        </CardHeader>

        <CardContent className='flex justify-center gap-x-3 -mt-4'>
            <WeaponDamageView weaponOffense={offense} />
            <CriticalView weaponOffense={offense} />
        </CardContent>
    </Card>
  );
};

function WeaponDamageView({ weaponOffense }: { weaponOffense: WeaponOffense }) 
{
    return (
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
        {weaponOffense.amount}(k{weaponOffense.grade * 2}+{weaponOffense.bonus})
      </Badge>
    );
}

function CriticalView({ weaponOffense }: { weaponOffense: WeaponOffense }) 
{
    const calculatedRange = `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;

    return (
        <div className='flex gap-x-2'>
            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">{calculatedRange}</Badge>
            <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-500">+{weaponOffense.critical.power}</Badge>
        </div>
    );
}