"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/ui/form";
import { useState } from "react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { FieldPath, FieldValues, useFormContext } from "react-hook-form";
import { displayedText } from "@/presentation/translations";
import { addIcon } from "@/presentation/icons";

export type FormStringsInputProps<TFieldValues extends FieldValues> = 
{
  path: FieldPath<TFieldValues>;
  placeholder?: string;
  maxCount?: number;
};

export function FormStringsInput<TFieldValues extends FieldValues>({ path, placeholder = displayedText.addString, maxCount = 15 }: FormStringsInputProps<TFieldValues>) 
{
  const { control } = useFormContext<TFieldValues>();
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  return (
    <FormField
      control={control}
      name={path}
      render={({ field }) => 
      {
        const items = (Array.isArray(field.value) ? field.value : []) as string[];

        const handleAddItem = () => 
        {
          const trimmedValue = inputValue.trim();
          setValidationError(null); // Clear previous validation error
          
          if (!trimmedValue) 
          {
            setValidationError(displayedText.stringCannotBeEmpty);
            return;
          }

          if (items.includes(trimmedValue)) 
          {
            setValidationError(displayedText.stringAlreadyExists);
            return;
          }

          if (items.length >= maxCount) 
          {
            setValidationError(`${displayedText.maximum} ${maxCount} ${displayedText.stringAllowed}`);
            return;
          }

          field.onChange([...items, trimmedValue]);
          setInputValue("");
        };

        const handleRemoveString = (stringToRemove: string) => 
        {
          field.onChange(items.filter(string => string !== stringToRemove));
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => 
        {
          if (e.key === "Enter") 
          {
            e.preventDefault();
            handleAddItem();
          }
        };

        return (
          <FormItem>
            <FormControl>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 items-center justify-center">
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={e => 
                    {
                      setInputValue(e.target.value);
                      setValidationError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-46"
                  />

                  <Button type="button" onClick={handleAddItem} variant="outline">
                    {addIcon("scale-90")}
                  </Button>
                  
                </div>

                { validationError && <p className="text-sm font-medium text-destructive flex place-content-center">{validationError}</p> }

                {
                  items.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                    {
                      items.map(item => (
                        <div key={item} className="text-sm border rounded-full px-2 py-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveString(item)}
                            className="hover:text-destructive"
                            aria-label={`Remove ${item}`}
                          >
                          {item}
                          </button>
                        </div>
                      ))
                    }
                    </div>
                  )
                }
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default FormStringsInput;
