import IncreaseButton from '@/components/buttons/IncreaseButton';
import DecreaseButton from '@/components/buttons/DecreaseButton';
import { ChevronUp, ChevronDown } from "lucide-react";

type VerticalChangeButtonsProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
}

export default function VerticalChangeButtons({ value, setValue }: VerticalChangeButtonsProps)
{
  return (
    <div className='flex flex-row'>
        <div className='flex flex-col items-center justify-center'>
            <IncreaseButton className='w-auto h-auto p-0' variant='ghost' value={value} setValue={setValue} icon={<ChevronUp />} />
            <DecreaseButton className='w-auto h-auto p-0' variant='ghost' value={value} setValue={setValue} icon={<ChevronDown />} />
        </div>
    </div>
  );
};