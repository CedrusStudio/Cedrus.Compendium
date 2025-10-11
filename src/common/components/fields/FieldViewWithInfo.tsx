import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/ui/hover-card";
import { BsInfoCircle } from "react-icons/bs";
import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

type FieldViewWithInfoProps = 
{
  value: number;
  infoContent: React.ReactNode;
  className?: string;
  nameClassName?: string;
  valueClassName?: string;
  infoTriggerClassName?: string;
};

export default function FieldViewWithInfo(input: PropsWithChildren<FieldViewWithInfoProps>) 
{
  return (
    <div className={cn('flex gap-x-6 justify-around', input.className)}>

      <div className={cn("capitalize", input.nameClassName)}>
        {input.children}
      </div>

      <div className={cn("flex items-center gap-2", input.valueClassName)}>
        {input.value}

        <HoverCard openDelay={350} closeDelay={100}>
          <HoverCardTrigger className={input.infoTriggerClassName}>{<BsInfoCircle />}</HoverCardTrigger>
          <HoverCardContent>
            {input.infoContent}
          </HoverCardContent>
        </HoverCard>
        
      </div>

    </div>
  );
};
