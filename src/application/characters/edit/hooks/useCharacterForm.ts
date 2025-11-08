import { useForm, UseFormReturn, UseFormProps, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormMutation } from "@/infrastructure/hooks/useFormMutation";
import { createCharacterCacheKeys } from "@/application/characters/edit/editFormConstants";
import { ZodType } from "zod";

type UseCharacterFormParams<TFormData extends FieldValues> = 
{
  characterId: string;
  schema: ZodType<TFormData, TFormData>;
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

export function useCharacterForm<TFormData extends FieldValues>
(
    {
        characterId,
        schema,
        defaultValues,
        updateFn,
        formId,
        formMode = "onBlur",
        toastPosition = "bottom-left",
    }
        : UseCharacterFormParams<TFormData>
)
    : UseCharacterFormReturn<TFormData> 
{
  const form = useForm<TFormData>
  ({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
    mode: formMode,
  });

  const { handleSubmit, isPending } = useFormMutation
  (
    async (data: TFormData) => await updateFn(characterId, data),
    {
      invalidateOnSuccess: createCharacterCacheKeys(characterId),
      toastPosition,
    }
  );

  return {
    form,
    handleSubmit,
    isPending,
    formId,
  };
}
