import IncreaseButton from '@/components/buttons/IncreaseButton';
import DecreaseButton from '@/components/buttons/DecreaseButton';
import ResetButton from '@/components/buttons/ResetButton';
import ChangeAmountInput from '@/components/buttons/ChangeAmountInput';

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
    <div className='flex gap-x-4 lg:gap-x-6 items-center justify-center'>
        <ChangeAmountInput value={value} setValue={setChangeAmount} />
        <DecreaseButton value={value} setValue={setValue} />
        <IncreaseButton value={value} setValue={setValue} />
        <ResetButton value={resetValue} setValue={setValue} />
    </div>
  );
};