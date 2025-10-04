import { Button } from "@/components/ui/button";
import { type VariantType } from "@/utils/VariantType";
import { RiResetLeftFill } from "react-icons/ri";
import { ChangeValueSideEffect } from "@/utils/global/ChangeValueSideEffect";

type ResetButtonProps =
{
    valuesWithSetters: [number, React.Dispatch<React.SetStateAction<number>>, ChangeValueSideEffect?][];
    variant?: VariantType;
    className?: string;
    icon?: React.ReactNode;
}

export default function ResetButton({ valuesWithSetters, variant = "outline", className, icon }: ResetButtonProps)
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

const reset = (defaultValue: number, setStateAction: React.Dispatch<React.SetStateAction<number>>, sideEffect?: ChangeValueSideEffect) => 
{
    setStateAction
    (
        previousValue => 
        {
            if (previousValue === defaultValue) return previousValue;
            sideEffect?.(defaultValue);
            return defaultValue;
        }
    );
};
