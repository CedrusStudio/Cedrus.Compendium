import { Button } from "@/ui/button";
import { type VariantType } from "@/common/VariantType";
import { RiResetLeftFill } from "react-icons/ri";
import { ChangeValueSideEffect } from "@/common/global/ChangeValueSideEffect";

type ResetButtonProps =
{
    defaultValuesWithSetters: [number, React.Dispatch<React.SetStateAction<number>>, ChangeValueSideEffect?][];
    variant?: VariantType;
    className?: string;
    icon?: React.ReactNode;
}

export default function ResetButton({ defaultValuesWithSetters: valuesWithSetters, variant = "outline", className, icon }: ResetButtonProps)
{
  return (
    <Button 
      type="button" 
      variant={variant} 
      size="icon" 
      onClick={() => valuesWithSetters.forEach(([defaultValue, setValue, sideEffect]) => reset(defaultValue, setValue, sideEffect))}
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
