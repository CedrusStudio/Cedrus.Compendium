import { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export type SelectFormFieldProps<TFieldValues extends FieldValues> = 
{
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  items: readonly string[] | readonly number[];
  labelText?: string;
  noLabel?: boolean;
};

export function SelectFormField<TFieldValues extends FieldValues>({ name, control, items, labelText, noLabel }: SelectFormFieldProps<TFieldValues>)
{
    return (
        <FormField control={control} name={name} render={({field}) => (
            <FormItem>
                {!noLabel && <FormLabel className='capitalize'>{labelText || name}</FormLabel>}
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