import IncreaseButton from '@/components/buttons/IncreaseButton';
import DecreaseButton from '@/components/buttons/DecreaseButton';
import { ChevronUp, ChevronDown } from "lucide-react";
import { ChangeValueSideEffect } from '@/utils/global/ChangeValueSideEffect';

type VerticalChangeButtonsProps =
{
    value?: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    sideEffect?: ChangeValueSideEffect;
}

export default function VerticalChangeButtons({ value = 1, setValue, sideEffect }: VerticalChangeButtonsProps)
{
  return (
    <div className='flex flex-row'>
      <div className='flex flex-col items-center justify-center'>
        <IncreaseButton className='w-auto h-auto p-0' variant='ghost' value={value} setValue={setValue} icon={<ChevronUp />} sideEffect={sideEffect} />
        <DecreaseButton className='w-auto h-auto p-0' variant='ghost' value={value} setValue={setValue} icon={<ChevronDown />} sideEffect={sideEffect} />
      </div>
    </div>
  );
};