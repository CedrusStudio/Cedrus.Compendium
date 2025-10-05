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
  name: FieldPath<TFieldValues>;
  inputPlaceholder?: string;
  inputClassName?: string;
};

export function InputFormField<TFieldValues extends FieldValues>(input: CustomFormFieldProps<TFieldValues>) 
{
  const { control } = useFormContext<TFieldValues>();
  
  return (
    <div className="w-full flex justify-center gap-2">
      <FormField
        control={control}
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