"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { upsertCharacterTalentsSchema, type UpsertCharacterTalentsType } from "@/persistence/characterSchemas";
import SubmitButton from "@/common/components/form/SubmitButton";
import { defaultColumns } from "@/application/characters/talents/defaultColumns"
import { EditTalentsTable } from "@/application/characters/edit/talents/EditTalentsTable"
import { Character } from "@/domain/characters/Character";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import bffClient from "@/infrastructure/bffClient";
import { Button } from "@/common/components/ui/button";

export default function EditCharacterTalents(input: { character: Character })
{
  const initialValues: UpsertCharacterTalentsType = 
  {
    talents: input.character.talents
  };

  console.log("Initial form values:", initialValues);

  const form = useForm<UpsertCharacterTalentsType>
  ({
    resolver: zodResolver(upsertCharacterTalentsSchema),
    defaultValues: initialValues
  });
  
  const { character } = input;
  const id = character.id;

  const { handleSubmit, isPending } = useFormMutation
  (
    async (characterTalents: UpsertCharacterTalentsType) => await bffClient.upsertCharacter(id, { ...character, talents: characterTalents.talents }),
    {
      invalidateOnSuccess: ['characters', `characters/${id}`, `characters/${id}/edit`]
    }
  );


  function DebugButtons() 
  {
    const isPending = false; //Your pending state here

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
      const result = upsertCharacterTalentsSchema.safeParse(form.getValues());
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <EditTalentsTable columns={defaultColumns} initialTalents={initialValues.talents} isPending={isPending}/>
        <SubmitButton isPending={isPending} />
        <DebugButtons />
      </form>
    </Form>
  );
};

