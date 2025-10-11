import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';

type CategorySelectFilterProps =
{
    selectedCategory: string;
    handleOnSelectedValueChange: (value: string) => void;
    defaultColumnKeys: { category: string };
    categories: readonly string[];
    allCategory: string;
}

export default function CategorySelectFilter({ selectedCategory, handleOnSelectedValueChange, defaultColumnKeys, allCategory, categories }: CategorySelectFilterProps)
{
  return (
    <Select name={defaultColumnKeys.category} defaultValue={"all"} value={selectedCategory} onValueChange={handleOnSelectedValueChange}>

        <div className={'flex gap-x-10 items-center justify-around'}>
            <SelectTrigger className='capitalize'>
                <SelectValue />
            </SelectTrigger>
        </div>

        <SelectContent>
            <SelectItem key={"all"} value={"all"}>
            <span className='capitalize'>{allCategory}</span>
            </SelectItem>
            {
                categories.map(category => (
                    <SelectItem key={category} value={category}>
                        <span className='capitalize'>{category}</span>
                    </SelectItem>
            ))
            }
        </SelectContent>

    </Select>
  );
};