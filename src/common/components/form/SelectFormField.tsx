import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/ui/form';
import { displayedText } from '@/common/translations';

export type SelectFormFieldProps<TFieldValues extends FieldValues> = 
{
  path: FieldPath<TFieldValues>;
  items: readonly string[] | readonly number[];
  labelText?: string;
  noLabel?: boolean;
};

export function SelectFormField<TFieldValues extends FieldValues>({ path, items, labelText, noLabel }: SelectFormFieldProps<TFieldValues>)
{
    const { control } = useFormContext<TFieldValues>();
    const getItemLabel = (item: string | number) => typeof item === 'string'
      ? displayedText[item as keyof typeof displayedText] || item
      : String(item);
    
    return (
        <FormField control={control} name={path} render={({field}) => (
            <FormItem>
                {!noLabel && <FormLabel className='capitalize'>{displayedText[(labelText || path) as keyof typeof displayedText] }</FormLabel>}
                
                <Select onValueChange={field.onChange} defaultValue={String(field.value)}>

                    <FormControl>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                    {
                        items.map(item => (
                            <SelectItem key={item} value={String(item)}>
                                {getItemLabel(item)}
                            </SelectItem>
                        ))
                    }
                    </SelectContent>
                </Select>

            </FormItem>
            )}
        />
    )
};