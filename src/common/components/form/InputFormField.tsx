import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
  optional?: boolean;
  label?: string;
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
          <FormItem className={input.label ? "min-w-0 max-w-full justify-items-center" : "min-w-0 max-w-full"}>
            {input.label && <FormLabel className="text-center capitalize">{input.label}</FormLabel>}
            <FormControl hasDescription={false}>
              <Input placeholder={input.inputPlaceholder} {...field} numeric={input.numeric}
                value={input.numeric ? field.value ?? "" : field.value}
                onChange={event => field.onChange(input.numeric && input.optional && event.target.value.trim() === ""
                  ? undefined : event.target.value)} className={input.inputClassName} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
        />
    </div>
  );
}
