import { Button } from "@/components/ui/button";
import { reset } from "@/utils/adjustValues";
import { type VariantType } from "@/utils/VariantType";
import { RiResetLeftFill } from "react-icons/ri";

type ResetButtonProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    variant?: VariantType;
    className?: string;
    icon?: React.ReactNode;
}

export default function ResetButton({ value, setValue, variant = "outline", className, icon }: ResetButtonProps)
{
  return (
    <Button variant={variant} size="icon" onClick={() => reset(value, setValue)} className={className}>
      {icon || <RiResetLeftFill />}
    </Button>
  );
};