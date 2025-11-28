import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/ui/hover-card";
import { BsInfoCircle } from "react-icons/bs";
import { cn } from "@/lib/utils";

type LabelWithInfoProps = 
{
  name: string | React.ReactNode;
  infoContent: React.ReactNode;
  className?: string;
  nameClassName?: string;
  infoTriggerClassName?: string;
};

export default function LabelWithInfo(input: LabelWithInfoProps) 
{
  return (
    <div className={cn('flex place-items-center gap-3', input.className)}>

      <div className={cn("capitalize text-xl", input.nameClassName)}>
        {input.name}
      </div>

      <HoverCard openDelay={350} closeDelay={100}>
        <HoverCardTrigger className={input.infoTriggerClassName}>{<BsInfoCircle />}</HoverCardTrigger>
        <HoverCardContent>
        {input.infoContent}
        </HoverCardContent>
      </HoverCard>

    </div>
  );
};
