import { WeaponOffense } from '@/domain/Character';
import { Badge } from '@/components/ui/badge';
import VerticalChangeButtons from '@/components/global/buttons/VerticalChangeButtons';

type CriticalViewProps = 
{
  weaponOffense: WeaponOffense;
  setRange: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
};

export default function CriticalView({ weaponOffense, setRange, setPower }: CriticalViewProps) 
{
    const calculatedRange = `${Math.max(weaponOffense.grade * 2 - weaponOffense.critical.range, 0)}-${weaponOffense.grade * 2}`;

    return (
        <div className='flex gap-x-1'>

            <div className='flex items-center'>
                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">
                    {calculatedRange}
                </Badge>
                <VerticalChangeButtons setValue={setRange} />
            </div>
            
            <div  className='flex items-center'>
                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-500">
                    {weaponOffense.critical.power > 0 ? '+' : ''}{weaponOffense.critical.power}
                </Badge>
                <VerticalChangeButtons setValue={setPower} />
            </div>
            
        </div>
    );
}