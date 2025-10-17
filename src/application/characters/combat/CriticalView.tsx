import { toCriticalRangeString, WeaponOffense } from '@/domain/characters/combat/Offense';
import { Badge } from '@/ui/badge';
import VerticalChangeButtons from '@/common/components/buttons/VerticalChangeButtons';
import IncreaseButton from '@/common/components/buttons/IncreaseButton';
import DecreaseButton from '@/common/components/buttons/DecreaseButton';
import { leftIcon, rightIcon } from '@/presentation/icons';

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
                <IncreaseButton className='w-auto h-auto p-0' variant='ghost' value={1} setValue={setRange} icon={leftIcon} />
                <Badge className="h-5 min-w-5 rounded-full px-1 font-mono tabular-nums bg-yellow-300">
                    {toCriticalRangeString(weaponOffense)}
                </Badge>
                <DecreaseButton className='w-auto h-auto p-0' variant='ghost' value={1} setValue={setRange} icon={rightIcon} />
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