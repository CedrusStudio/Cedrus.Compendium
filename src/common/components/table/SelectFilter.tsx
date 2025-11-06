import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

type SelectFilterProps =
{
    selectedOption: string;
    handleOnSelectedValueChange: (value: string) => void;
    columnKey: string;
    options: readonly string[];
    allOption: string;
}

export default function SelectFilter({ selectedOption, handleOnSelectedValueChange, columnKey, options, allOption }: SelectFilterProps)
{
  return (
    <Select name={columnKey} defaultValue={"all"} value={selectedOption} onValueChange={handleOnSelectedValueChange}>

        <div className={'flex gap-x-10 items-center justify-around'}>
            <SelectTrigger className='capitalize'>
                <SelectValue />
            </SelectTrigger>
        </div>

        <SelectContent>
            <SelectItem key={"all"} value={"all"}>
            <span className='capitalize'>{allOption}</span>
            </SelectItem>
            {
                options.map(option => (
                    <SelectItem key={option} value={option}>
                        <span className='capitalize'>{option}</span>
                    </SelectItem>
                ))
            }
        </SelectContent>

    </Select>
  );
};