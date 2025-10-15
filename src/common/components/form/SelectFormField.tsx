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
  FormMessage,
} from '@/ui/form';
import { displayedText } from '@/presentation/translations';

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
                                {item}
                            </SelectItem>
                        ))
                    }
                    </SelectContent>
                </Select>

                <FormMessage />
            </FormItem>
            )}
        />
    )
};