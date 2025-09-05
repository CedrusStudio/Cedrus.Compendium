import { DamageOffense } from '@/domain/Character';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DamageBonusCard({ damageBonus, className }: { damageBonus: DamageOffense, className?: string })
{
  return (
    <Card className={className}>
        <CardHeader>
            <CardTitle className='font-bold text-2xl capitalize text-center text-primary'>Damage Bonus</CardTitle>
        </CardHeader>

        <CardContent className='flex justify-center -mt-4'>
            <DamageBonusView damageOffense={damageBonus} />
        </CardContent>
    </Card>
  );
};

function DamageBonusView({ damageOffense }: { damageOffense: DamageOffense }) 
{
    return (
      <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-red-500">
        {damageOffense.amount}k{damageOffense.grade * 2}+{damageOffense.bonus}
      </Badge>
    );
}
