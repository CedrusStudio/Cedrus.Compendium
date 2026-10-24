import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/ui/form";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";
import { Input } from "@/ui/input";

export type CustomFormFieldProps<TFieldValues extends FieldValues> = 
{
  path: FieldPath<TFieldValues>;
  inputPlaceholder?: string;
  inputClassName?: string;
  numeric?: boolean;
};

export function InputFormField<TFieldValues extends FieldValues>(input: CustomFormFieldProps<TFieldValues>) 
{
  const { control } = useFormContext<TFieldValues>();
  
  return (
    <div className="w-full flex justify-center gap-2">
      <FormField
        control={control}
        name={input.path}
        render={({ field }) => (
          <FormItem className="min-w-0 max-w-full">
            <FormControl>
              <Input placeholder={input.inputPlaceholder} {...field} numeric={input.numeric} className={input.inputClassName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
        />
    </div>
  );
}
