import { Button } from "@/components/ui/button";
import { increase } from "@/utils/adjustValues";
import { type VariantType } from "@/utils/VariantType";
import { cn } from "@/lib/utils";
import { IoAdd } from "react-icons/io5";

type IncreaseButtonProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    variant?: VariantType;
    className?: string;
}

export default function IncreaseButton({ value, setValue, variant = "outline", className }: IncreaseButtonProps)
{
  return (
    <Button variant={variant} onClick={() => increase(value, setValue)} className={cn(`w-10`, className)}>
        <IoAdd />
    </Button>
  );
};