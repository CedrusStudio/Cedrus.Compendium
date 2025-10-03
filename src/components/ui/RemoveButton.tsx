"use client";

import { Button, ButtonVariants } from "@/components/ui/button";
import { Control, FieldValues, Path, useController } from "react-hook-form";
import { IoTrashOutline } from "react-icons/io5";

type RemoveButtonProps<TType extends FieldValues> =
{
  name: Path<TType>;
  control: Control<TType>;
  variant?: ButtonVariants;
  callback?: () => void;
}

export default function RemoveButton<TType extends FieldValues>({ name, control, variant = 'destructive', callback }: RemoveButtonProps<TType>)
{
  const { field } = useController
  ({
    name,
    control
  });

  return (
    <Button 
      variant={variant}
      size='icon' 
      onClick={() => 
      {
        field.onChange(undefined)
        callback?.()
      }} 
    >
      <IoTrashOutline />
    </Button>
  );
};
