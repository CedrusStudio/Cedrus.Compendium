import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

type FieldViewProps = 
{
  value: number | string;
  className?: string;
  nameClassName?: string;
  valueClassName?: string;
};

export default function FieldWithIconView(input: PropsWithChildren<FieldViewProps>) 
{
  return (
    <div className={cn('flex items-center justify-around', input.className)}>
      <div className={cn("capitalize", input.nameClassName)}>{input.children}</div>
      <div className={cn("w-8", input.valueClassName)}>{input.value}</div>
    </div>
  );
};
