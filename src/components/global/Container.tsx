import { cn } from '@/lib/utils';
import { type PropsWithChildren } from "react";

type ContainerProps = PropsWithChildren & {
  className?: string;
};

export default function Container({ children, className }: ContainerProps) 
{
  return (
    <div className={cn('mx-auto max-w-6xl xl:max-w-7xl px-8', className)}>
      {children}
    </div>
  );
}