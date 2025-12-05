"use client";

import { cn } from "@/lib/utils";
import { Info } from "lucide-react";
import { Activity, PropsWithChildren, useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/ui/hover-card";
import { Button } from "@/ui/button";
import { DataCard } from "@/common/components/cards";
import { closeIcon } from "@/common/icons";

interface FieldInfoProps 
{
  className?: string;
}

export function FieldInfo({ className, children }: PropsWithChildren<FieldInfoProps>) 
{
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <HoverCard openDelay={350} closeDelay={100}>
        
        <HoverCardTrigger asChild>
          <Button 
            asChild
            variant="ghost" 
            size="icon" 
            className={cn("w-4 h-4", className)} 
            onClick={() => setIsOpen(!isOpen)}
          >
            <Info className="text-muted-foreground cursor-help" />
          </Button>
        </HoverCardTrigger>

        <HoverCardContent>
          {children}
        </HoverCardContent>
        
      </HoverCard>

      <Activity mode={isOpen ? "visible" : "hidden"}>
        <div 
          className="fixed inset-0 w-full h-full z-40 bg-black/50" 
          onClick={() => setIsOpen(false)}
        />
        
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <DataCard className="max-w-96 max-h-[80vh] overflow-y-auto">
            <Button 
              variant="ghost" 
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              {closeIcon}
            </Button>

            {children}

          </DataCard>
        </div>
      </Activity>
    </>
  );
}
