import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { FieldPath, FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Control } from 'react-hook-form';

export type CustomFormFieldProps<TFieldValues extends FieldValues> = 
{
  name: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  inputPlaceholder?: string;
  inputClassName?: string;
};

export function InputFormField<TFieldValues extends FieldValues>(input: CustomFormFieldProps<TFieldValues>) 
{
  return (
    <div className="w-full flex justify-center gap-2">
      <FormField
        control={input.control}
        name={input.name}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input placeholder={input.inputPlaceholder} {...field} className={input.inputClassName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
        />
    </div>
  );
}