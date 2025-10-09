import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/tooltip";

export default function IconWithTooltip({ icon, name }: { icon: React.ReactNode; name: string })
{
  return (
    <Tooltip>
        <TooltipTrigger asChild>
        {icon}
        </TooltipTrigger>
        <TooltipContent>
        <p className="capitalize">{name}</p>
        </TooltipContent>
    </Tooltip>
  );
};