import IncreaseButton from '@/components/IncreaseButton';
import DecreaseButton from '@/components/DecreaseButton';
import ResetButton from '@/components/ResetButton';
import ChangeAmountInput from '@/components/ChangeAmountInput';

type ChangeButtonsProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    setChangeAmount: React.Dispatch<React.SetStateAction<number>>;
    resetValue: number;
}

export default function ChangeButtons({ value, setValue, setChangeAmount, resetValue }: ChangeButtonsProps)
{
  return (
    <div className='flex gap-x-6 lg:gap-x-8 items-center justify-center'>
        <ChangeAmountInput value={value} setValue={setChangeAmount} />
        <DecreaseButton value={value} setValue={setValue} />
        <IncreaseButton value={value} setValue={setValue} />
        <ResetButton value={resetValue} setValue={setValue} />
    </div>
  );
};