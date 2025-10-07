"use client";

import { Button, ButtonVariants } from "@/ui/button";
import { ArrayPath, FieldArray, FieldValues, useFieldArray } from "react-hook-form";
import { LuPlus } from "react-icons/lu";

type AppendToArrayButtonProps<TType extends FieldValues, TName extends ArrayPath<TType>> =
{
  isPending: boolean;
  name: TName;
  toAdd: FieldArray<TType, TName> | (() => FieldArray<TType, TName>);
  variant?: ButtonVariants;
}

export default function AppendToArrayButton<TType extends FieldValues, TName extends ArrayPath<TType>>({ isPending, name, toAdd, variant = "outline" }: AppendToArrayButtonProps<TType, TName>)
{
  const { append } = useFieldArray<TType, TName>({ name });

  return (
    <Button 
      variant={variant} 
      size="icon" 
      disabled={isPending} 
      type="button"
      onClick={() => append
      (
        typeof toAdd === "function"
          ? (toAdd as () => FieldArray<TType, TName>)()
          : toAdd
      )}
    >
      <LuPlus className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  );
};