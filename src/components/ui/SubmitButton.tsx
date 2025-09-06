import { Button } from "@/components/ui/button"

export default function SubmitButton(input: { isPending: boolean })
{
 return (
  <div className="flex justify-center">
    <Button type="submit" className="self" disabled={input.isPending}>
        { input.isPending ? "Submitting..." : "Submit" }
    </Button>
  </div>
 ) 
}