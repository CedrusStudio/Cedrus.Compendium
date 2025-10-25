import SubmitButton from "@/common/components/form/SubmitButton";
import { Button } from "@/ui/button";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";

type DebugButtonsProps<TFieldValues extends FieldValues = FieldValues, TContext = unknown, TTransformedValues = TFieldValues> =
{
    schema: z.ZodTypeAny;
    isPending: boolean;
    form: UseFormReturn<TFieldValues, TContext, TTransformedValues>;
}

export default function DebugButtons<TFieldValues extends FieldValues = FieldValues, TContext = unknown, TTransformedValues = TFieldValues>({ schema, isPending, form }: DebugButtonsProps<TFieldValues, TContext, TTransformedValues>) 
{
    // Debug function to check form state
    const debugFormState = () => 
    {
      console.log("=== FORM DEBUG INFO ===");
      console.log("Form Values:", form.getValues());
      console.log("Form Errors:", form.formState.errors);
      console.log("Is Valid:", form.formState.isValid);
      console.log("Is Submitting:", form.formState.isSubmitting);
      console.log("Is Pending:", isPending);
      console.log("Dirty Fields:", form.formState.dirtyFields);
      console.log("Touched Fields:", form.formState.touchedFields);
      
      // Check schema validation manually
      const result = schema.safeParse(form.getValues());
      console.log("Schema Validation Result:", result);
      
      if (!result.success) 
    {
        console.log("Schema Validation Errors:", result.error.format());
      }
      
      alert(`Form Debug Info logged to console. Check browser DevTools.
      Valid: ${form.formState.isValid}
      Errors: ${Object.keys(form.formState.errors).length}
      ${!result.success ? `Schema Errors: ${JSON.stringify(result.error.format(), null, 2)}` : ''}`);
    };

    return (
        <div className="flex gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <SubmitButton isPending={isPending} />
        
        <Button 
            type="button" 
            variant="outline" 
            onClick={debugFormState}
            className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
        >
            🐛 Debug Form
        </Button>
        
        <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
            console.log("Force submitting form...");
            form.handleSubmit
            (
                (data) => 
                {
                    console.log("✅ Valid data:", data);
                    //handleSubmit(data);
                },
                (errors) => 
                {
                    console.log("❌ Form validation errors:", errors);
                    alert(`Validation Errors:\n${JSON.stringify(errors, null, 2)}`);
                }
            )();
            }}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
        >
            🔄 Force Submit
        </Button>
        
        <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
            form.trigger().then((isValid) => {
                console.log("Manual validation result:", isValid);
                console.log("Errors after trigger:", form.formState.errors);
                alert(`Manual validation: ${isValid ? 'VALID' : 'INVALID'}\nCheck console for details.`);
            });
            }}
            className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
        >
            ✅ Validate Now
        </Button>
        </div>
    );
}