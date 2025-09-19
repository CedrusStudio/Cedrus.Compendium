import { Button } from "@/components/ui/button"

export default function SubmitButton(input: { isPending: boolean, className?: string, formName?: string })
{
 return (
  <div className="flex justify-center">
    <Button type="submit" className={`self ${input.className}`} disabled={input.isPending} form={input.formName}>
      { input.isPending ? "Submitting..." : "Submit" }
    </Button>
  </div>
 ) 
}