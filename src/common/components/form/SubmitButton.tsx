import { displayedText } from "@/presentation/translations";
import { Button } from "@/ui/button"

type SubmitButtonProps =
{
  isPending: boolean;
  className?: string;
  formName?: string;
  overrideTextWhenPending?: string;
  overrideText?: string;
}

export default function SubmitButton(input: SubmitButtonProps)
{
 return (
  <div className="flex justify-center">
    <Button type="submit" className={`self ${input.className}`} disabled={input.isPending} form={input.formName}>
      { input.isPending ? input.overrideTextWhenPending || displayedText.saving : input.overrideText || displayedText.save }
    </Button>
  </div>
 ) 
}