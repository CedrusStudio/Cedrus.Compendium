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
      { input.isPending ? input.overrideTextWhenPending || "Zapisuję..." : input.overrideText || "Zapisz" }
    </Button>
  </div>
 ) 
}