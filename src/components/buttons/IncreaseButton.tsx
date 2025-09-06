import { Button } from "@/components/ui/button";
import { increase } from "@/utils/adjustValues";
import { type VariantType } from "@/utils/VariantType";
import { cn } from "@/lib/utils";
import { IoAdd } from "react-icons/io5";
import { ChangeValueSideEffect } from "@/utils/ChangeValueSideEffect";

type IncreaseButtonProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    variant?: VariantType;
    className?: string;
    icon?: React.ReactNode;
    sideEffect?: ChangeValueSideEffect;
}

export default function IncreaseButton({ value, setValue, variant = "outline", className, icon, sideEffect }: IncreaseButtonProps)
{
  return (
    <Button 
      type="button" 
      variant={variant}
      className={cn(className)} 
      onClick={() => increase(value, setValue, sideEffect)}
    >
        {icon || <IoAdd />}
    </Button>
  );
};