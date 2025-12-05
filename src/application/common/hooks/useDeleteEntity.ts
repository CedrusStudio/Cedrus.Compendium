"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

type UseDeleteEntityConfig = 
{
  client: { delete: (id: string) => Promise<void> };
  queryKey: string[];
  redirectPath?: string;
  onOptimisticDelete?: (id: string) => void;
};

export function useDeleteEntity({ client, queryKey, redirectPath, onOptimisticDelete }: UseDeleteEntityConfig)
{
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate, isPending } = useMutation
  ({
    mutationFn: async (id: string) => await client.delete(id),
    onMutate: async (id: string) =>
    {
      if (onOptimisticDelete)
      {
        onOptimisticDelete(id);
      }
    },
    onSuccess: () =>
    {
      queryClient.invalidateQueries({ queryKey });
      if (redirectPath)
      {
        router.push(redirectPath);
      }
    },
    onError: (error) => 
    {
      console.error(`Error deleting ${queryKey.join(', ')}:`, error);
      queryClient.invalidateQueries({ queryKey });
    }
  });

  return { deleteEntity: mutate, isPending };
};
