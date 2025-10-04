import { Button } from "@/components/ui/button";
import { reset } from "@/utils/adjustValues";
import { ChangeValueSideEffect } from "@/utils/global/ChangeValueSideEffect";
import { type VariantType } from "@/utils/VariantType";
import { RiResetLeftFill } from "react-icons/ri";

type ResetMultipleButtonProps =
{
    valuesWithSetters: [number, React.Dispatch<React.SetStateAction<number>>, ChangeValueSideEffect?][];
    variant?: VariantType;
    className?: string;
    icon?: React.ReactNode;
}

export default function ResetMultipleButton({ valuesWithSetters, variant = "outline", className, icon }: ResetMultipleButtonProps)
{
  return (
    <Button 
      type="button" 
      variant={variant} 
      size="icon" 
      onClick={() => valuesWithSetters.forEach(([value, setValue, sideEffect]) => reset(value, setValue, sideEffect))}
      className={className}
    >
      {icon || <RiResetLeftFill />}
    </Button>
  );
};