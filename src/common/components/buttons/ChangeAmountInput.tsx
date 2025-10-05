import { Input } from "@/ui/input";
import { cn } from "@/lib/utils";

type ChangeAmountInputProps =
{
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
    className?: string;
}

export default function ChangeAmountInput({ value, setValue, className }: ChangeAmountInputProps)
{
  return (
    <Input 
        type="number" 
        value={value} 
        onChange={(e) => setValue(Number(e.target.value))} 
        className={cn("w-15 text-center", className)} 
    />
  );
};