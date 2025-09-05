import { Button } from "@/components/ui/button";
import { decrease } from "@/utils/adjustValues";
import { type VariantType } from "@/utils/VariantType";
import { cn } from "@/lib/utils";
import { FiMinus } from "react-icons/fi";

type DecreaseButtonProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    variant?: VariantType;
    className?: string;
}

export default function DecreaseButton({ value, setValue, variant = "outline", className }: DecreaseButtonProps)
{
  return (
    <Button variant={variant} onClick={() => decrease(value, setValue)} className={cn(`w-10`, className)}>
        <FiMinus />
    </Button>
  );
};