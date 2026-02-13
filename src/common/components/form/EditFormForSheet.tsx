"use client";

import { Form } from "@/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DefaultValues, FieldValues, useForm, UseFormProps } from "react-hook-form";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import { ZodType } from "zod";

type EditFormProps<TFormData extends FieldValues> =
{
  entityId: string;
  schema: ZodType<TFormData, TFormData>;
  defaultValues: DefaultValues<TFormData>;
  updateFn: (id: string, data: TFormData) => Promise<void>;
  formId: string;
  cacheKeys: string[];
  renderSheetContent: (isPending: boolean, formId: string) => React.ReactNode;
  formMode?: UseFormProps<TFormData>["mode"];
  toastPosition?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
}

export function EditFormForSheet<TFormData extends FieldValues>(input: EditFormProps<TFormData>)
{
  const form = useForm<TFormData>
  ({
    resolver: zodResolver(input.schema),
    defaultValues: input.defaultValues,
    mode: input.formMode || "onBlur",
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (data: TFormData) => await input.updateFn(input.entityId, data),
    {
      invalidateOnSuccess: input.cacheKeys,
      toastPosition: input.toastPosition || "bottom-left"
    }
  );
  
  return (
    <Form {...form}>
      <form id={input.formId} onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {input.renderSheetContent(isPending, input.formId)}
      </form>
    </Form>
  );
}