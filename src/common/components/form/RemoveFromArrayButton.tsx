"use client";

import { Button, ButtonVariants } from "@/ui/button";
import { UseFieldArrayRemove } from "react-hook-form";
import { IoTrashOutline } from "react-icons/io5";

type RemoveButtonProps =
{
  remove?: UseFieldArrayRemove;
  index?: number;
  onRemove?: () => void;
  variant?: ButtonVariants;
}

export default function RemoveFromArrayButton({ remove, index, onRemove, variant = 'destructive' }: RemoveButtonProps)
{
  const handleClick = () =>
  {
    if (onRemove)
    {
      onRemove();
      return;
    }

    if (remove && typeof index === 'number')
    {
      remove(index);
    }
  };

  return (
    <Button 
      variant={variant} 
      type="button"
      size='icon' 
      className=" hover:text-red-950"
      onClick={handleClick}><IoTrashOutline />
    </Button>
  );
};