import { useForm, UseFormReturn, UseFormProps, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import { createCharacterCacheKeys } from "@/application/characters/edit/editFormConstants";
import { ZodType } from "zod";

type UseCharacterFormParams<TFormData extends FieldValues> = 
{
  characterId: string;
  schema: ZodType<TFormData, any, any>;
  defaultValues: DefaultValues<TFormData>;
  updateFn: (id: string, data: TFormData) => Promise<void>;
  formId?: string;
  formMode?: UseFormProps<TFormData>["mode"];
  toastPosition?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
};

type UseCharacterFormReturn<TFormData extends FieldValues> = 
{
  form: UseFormReturn<TFormData>;
  handleSubmit: (data: TFormData) => void;
  isPending: boolean;
  formId?: string;
};

export function useCharacterForm<TFormData extends FieldValues>(input : UseCharacterFormParams<TFormData>)
  : UseCharacterFormReturn<TFormData> 
{
  const form = useForm<TFormData>
  ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(input.schema) as any,
    defaultValues: input.defaultValues,
    mode: input.formMode || "onBlur",
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (data: TFormData) => await input.updateFn(input.characterId, data),
    {
      invalidateOnSuccess: createCharacterCacheKeys(input.characterId),
      toastPosition: input.toastPosition,
    }
  );

  return {
    form,
    handleSubmit,
    isPending,
    formId: input.formId,
  };
}
