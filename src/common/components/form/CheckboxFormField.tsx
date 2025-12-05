import { FieldPath, FieldValues, useFormContext } from 'react-hook-form';
import { FormField, FormItem, FormLabel } from '@/ui/form';
import { displayedText } from '@/common/translations';
import { Checkbox } from '@/ui/checkbox';

export type CheckboxFormFieldProps<TFieldValues extends FieldValues> = 
{
  path: FieldPath<TFieldValues>;
  labelText?: string;
  noLabel?: boolean;
};

export default function CheckboxFormField<TFieldValues extends FieldValues>({ path, labelText, noLabel }: CheckboxFormFieldProps<TFieldValues>)
{
  const { control } = useFormContext<TFieldValues>();
    
    return (
        <FormField control={control} name={path} render={({field}) => (
            <FormItem>
                {!noLabel && <FormLabel className='capitalize'>{displayedText[(labelText || path) as keyof typeof displayedText] }</FormLabel>}
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormItem>
            )}
        />
    );
}