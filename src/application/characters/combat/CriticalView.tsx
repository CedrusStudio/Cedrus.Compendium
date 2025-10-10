import { calculateRange, WeaponOffense } from '@/domain/characters/Character';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';

type CriticalViewProps = 
{
  weaponOffense: WeaponOffense;
  setRange: React.Dispatch<React.SetStateAction<number>>;
  setPower: React.Dispatch<React.SetStateAction<number>>;
};

export default function CriticalView({ weaponOffense, setRange, setPower }: CriticalViewProps) 
{
    return (
        <div className='flex gap-x-1'>

            <div className='flex items-center'>
                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">
                    {calculateRange(weaponOffense)}
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