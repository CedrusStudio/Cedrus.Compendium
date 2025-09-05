import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { BsInfoCircle } from "react-icons/bs";
import { cn } from "@/lib/utils";

type FieldViewWithInfoIconProps = 
{
  name: string | React.ReactNode;
  value: number;
  infoContent: React.ReactNode;
  valueClassName?: string;
};

export default function FieldViewWithInfoIcon(input: FieldViewWithInfoIconProps) 
{
  return (
    <div className={'flex gap-x-6 items-center justify-around mx-3'}>
      
      <div className="w-24 pl-2 capitalize">
        {input.name}
      </div>

      <div className="flex items-center text-end gap-2">

        <div className={cn("w-17", input.valueClassName)}>
          {input.value}
        </div>

        <HoverCard openDelay={350} closeDelay={100}>
          <HoverCardTrigger>{<BsInfoCircle />}</HoverCardTrigger>
          <HoverCardContent>
            {input.infoContent}
          </HoverCardContent>
        </HoverCard>
        
      </div>

    </div>
  );
};
