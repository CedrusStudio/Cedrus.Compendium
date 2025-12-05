"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from '@/common/components/ui/card';
import { PropsWithChildren, ReactNode } from "react";

export interface DataCardProps 
{
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  variant?: "default" | "muted" | "primary";
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const variantStyles = 
{
  default: "",
  muted: "bg-muted",
  primary: "border-primary/50 bg-primary/5",
} as const;

export function DataCard
(
  { 
    title, 
    icon, 
    actions, 
    variant = "default", 
    className,
    headerClassName,
    contentClassName,
    children 
  }
  : PropsWithChildren<DataCardProps>
) 
{
  return (
    <Card className={cn(variantStyles[variant], className)}>

      <CardHeader className={headerClassName}>

        <div className="flex justify-between items-center">

          { 
            (title || icon) && (
              <CardTitle className="flex items-center gap-2 font-bold text-2xl capitalize text-center text-primary">
                {icon}
                <span>{title}</span>
              </CardTitle>
            )
          }

          {actions && <div className="flex gap-2">{actions}</div>}

        </div>

      </CardHeader>

      <CardContent className={contentClassName}>
        {children}
      </CardContent>
      
    </Card>
  );
}
