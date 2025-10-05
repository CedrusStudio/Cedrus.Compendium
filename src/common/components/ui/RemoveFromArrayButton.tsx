"use client";

import { Button, ButtonVariants } from "@/ui/button";
import { UseFieldArrayRemove } from "react-hook-form";
import { IoTrashOutline } from "react-icons/io5";

type RemoveButtonProps =
{
  remove: UseFieldArrayRemove;
  index: number;
  variant?: ButtonVariants;
}

export default function RemoveFromArrayButton({ remove, index, variant = 'destructive' }: RemoveButtonProps)
{
  return (
    <Button 
      variant={variant} 
      type="button"
      size='icon' 
      onClick={() => remove(index)}><IoTrashOutline />
    </Button>
  );
};