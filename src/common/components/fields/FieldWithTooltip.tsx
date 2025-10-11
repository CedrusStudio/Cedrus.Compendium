import { translate } from "@/domain/data/translations";
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
      <p className="capitalize">{translate(name)}</p>
      </TooltipContent>
    </Tooltip>
  );
};