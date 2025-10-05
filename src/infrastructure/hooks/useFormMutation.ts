import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { FieldValues } from 'react-hook-form';
import { onError, onSuccess } from "@/common/global/onSaveCallbacks";

export function useFormMutation<TData extends FieldValues>
(
  mutationFn: (data: TData) => Promise<void>,
  options: {
    initialValues: TData;
    invalidateOnSuccess?: string[];
    toastPosition?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  }
) 
{
  const queryClient = useQueryClient();
  const router = useRouter();

  const onSuccessWithRefresh = useCallback(() => 
  {
    onSuccess(() => 
    {
      for (const queryKey of options.invalidateOnSuccess ?? [])
      {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      }

      router.refresh();

    }, options.toastPosition);
  }, [queryClient, router, options.invalidateOnSuccess, options.toastPosition]);

  const mutation = useMutation
  ({
    mutationFn,
    onSuccess: onSuccessWithRefresh,
    onError: (error: Error) => onError(error, options.toastPosition),
  });

  const handleSubmit = useCallback
  (
    (values: TData) => mutation.mutate(values),
    [mutation]
  );

  return {
    ...mutation,
    handleSubmit,
  };
}