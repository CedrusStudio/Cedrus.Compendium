import { Button } from "@/components/ui/button";
import { reset } from "@/utils/adjustValues";
import { type VariantType } from "@/utils/VariantType";
import { cn } from "@/lib/utils";
import { RiResetLeftFill } from "react-icons/ri";

type ResetButtonProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    variant?: VariantType;
    className?: string;
}

export default function ResetButton({ value, setValue, variant = "outline", className }: ResetButtonProps)
{
  return (
    <Button variant={variant} onClick={() => reset(value, setValue)} className={cn(`w-10`, className)}>
      <RiResetLeftFill />
    </Button>
  );
};