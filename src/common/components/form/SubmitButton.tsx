import { LoaderCircle, Save } from "lucide-react";
import { displayedText } from "@/common/translations";
import { Button } from "@/ui/button";

type SubmitButtonProps =
{
  isPending: boolean;
  className?: string;
  formName?: string;
  overrideTextWhenPending?: string;
  overrideText?: string;
  iconOnly?: boolean;
}

export default function SubmitButton({ isPending, className, formName, overrideTextWhenPending, overrideText, iconOnly }: SubmitButtonProps)
{
  const label = isPending ? overrideTextWhenPending || displayedText.saving : overrideText || displayedText.save;
  const icon = isPending ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : <Save aria-hidden="true" />;
  const button = (
    <Button type="submit" disabled={isPending} form={formName} className={className}
      size={iconOnly ? "icon" : "default"} aria-label={iconOnly ? label : undefined} aria-busy={isPending || undefined}>
      {iconOnly ? icon : label}
    </Button>
  );

  return iconOnly ? button : <div className="flex justify-center">{button}</div>;
}
