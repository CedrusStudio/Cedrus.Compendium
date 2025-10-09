import { cn } from "@/lib/utils";

type FieldViewProps = 
{
  name: string | React.ReactNode;
  value: number | string;
  className?: string;
  nameClassName?: string;
  valueClassName?: string;
};

export default function FieldView(input: FieldViewProps) 
{
  return (
    <div className={cn('flex gap-x-6 items-center justify-around', input.className)}>
      <div className={cn("capitalize", input.nameClassName)}>{input.name}</div>
      <div className={cn("w-8", input.valueClassName)}>{input.value}</div>
    </div>
  );
};
