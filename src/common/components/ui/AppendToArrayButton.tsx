"use client";

import { Button, ButtonVariants } from "@/ui/button";
import { ArrayPath, FieldArray, FieldValues, UseFieldArrayAppend } from "react-hook-form";
import { LuPlus } from "react-icons/lu";

type AppendToArrayButtonProps<TType extends FieldValues, TName extends ArrayPath<TType>> =
{
  isPending: boolean;
  toAdd: FieldArray<TType, TName> | (() => FieldArray<TType, TName>);
  variant?: ButtonVariants;
  append: UseFieldArrayAppend<TType, TName>;
}

export default function AppendToArrayButton<TType extends FieldValues, TName extends ArrayPath<TType>>({ isPending, toAdd, variant = "outline", append }: AppendToArrayButtonProps<TType, TName>)
{
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