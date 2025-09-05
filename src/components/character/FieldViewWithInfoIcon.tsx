import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

type FieldViewWithInfoIconProps = 
{
  name: string;
  value: number;
  infoIcon: React.ReactNode;
  infoContent: React.ReactNode;
};

export default function FieldViewWithInfoIcon(input: FieldViewWithInfoIconProps) 
{
  return (
    <div className={'flex gap-x-6 items-center justify-around mx-3'}>
      <div className="w-24 pl-2 capitalize">{input.name}</div>

      <div className="flex items-center text-end gap-2">
        <div className="w-17">{input.value}</div>
        <HoverCard openDelay={350} closeDelay={100}>
          <HoverCardTrigger>{input.infoIcon}</HoverCardTrigger>
          <HoverCardContent>
            {input.infoContent}
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  );
};
