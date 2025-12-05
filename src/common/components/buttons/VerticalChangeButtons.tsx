import IncreaseButton from '@/common/components/buttons/IncreaseButton';
import DecreaseButton from '@/common/components/buttons/DecreaseButton';
import { ChangeValueSideEffect } from '@/common/global/ChangeValueSideEffect';
import { downIcon, upIcon } from '@/common/icons';

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
        <IncreaseButton className='w-auto h-auto p-0' variant='ghost' value={value} setValue={setValue} icon={upIcon} sideEffect={sideEffect} />
        <DecreaseButton className='w-auto h-auto p-0' variant='ghost' value={value} setValue={setValue} icon={downIcon} sideEffect={sideEffect} />
      </div>
    </div>
  );
};