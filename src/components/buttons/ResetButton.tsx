import { Button } from "@/components/ui/button";
import { reset } from "@/utils/adjustValues";
import { type VariantType } from "@/utils/VariantType";
import { RiResetLeftFill } from "react-icons/ri";
import { ChangeValueSideEffect } from "@/utils/global/ChangeValueSideEffect";

type ResetButtonProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    variant?: VariantType;
    className?: string;
    icon?: React.ReactNode;
    changeValueSideEffect?: ChangeValueSideEffect;
}

export default function ResetButton({ value, setValue, variant = "outline", className, icon, changeValueSideEffect }: ResetButtonProps)
{
  return (
    <Button type="button" variant={variant} size="icon" onClick={() => reset(value, setValue, changeValueSideEffect)} className={className}>
      {icon || <RiResetLeftFill />}
    </Button>
  );
};