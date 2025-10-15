import { displayedText } from "@/presentation/translations";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/ui/tooltip";
import { PropsWithChildren } from "react";

type FieldWithTooltipProps =
{
  name: string;
};

export default function FieldWithTooltip({ children, name }: PropsWithChildren<FieldWithTooltipProps>)
{
  return (
    <Tooltip>
      <TooltipTrigger asChild>
      <div>{children}</div>
      </TooltipTrigger>
      <TooltipContent>
      <p className="capitalize">{displayedText[name as keyof typeof displayedText]}</p>
      </TooltipContent>
    </Tooltip>
  );
};