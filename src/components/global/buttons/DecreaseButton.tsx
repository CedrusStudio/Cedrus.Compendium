import { Button } from "@/components/ui/button";
import { decrease } from "@/utils/adjustValues";
import { type VariantType } from "@/utils/VariantType";
import { cn } from "@/lib/utils";
import { FiMinus } from "react-icons/fi";
import { ChangeValueSideEffect } from "@/utils/global/ChangeValueSideEffect";

type DecreaseButtonProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    variant?: VariantType;
    className?: string;
    icon?: React.ReactNode;
    sideEffect?: ChangeValueSideEffect;
}

export default function DecreaseButton({ value, setValue, variant = "outline", className, icon, sideEffect }: DecreaseButtonProps)
{
  return (
    <Button 
      type="button" 
      variant={variant} 
      onClick={() => decrease(value, setValue, sideEffect)}
      className={cn(className)}
    >
      {icon || <FiMinus />}
    </Button>
  );
};