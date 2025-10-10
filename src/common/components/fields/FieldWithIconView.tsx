import { cn } from "@/lib/utils";

type FieldViewProps = 
{
  icon: React.ReactNode;
  value: number | string;
  className?: string;
  nameClassName?: string;
  valueClassName?: string;
};

export default function FieldWithIconView(input: FieldViewProps) 
{
  return (
    <div className={cn('flex items-center justify-around', input.className)}>
      <div className={cn("capitalize", input.nameClassName)}>{input.icon}</div>
      <div className={cn("w-8", input.valueClassName)}>{input.value}</div>
    </div>
  );
};
