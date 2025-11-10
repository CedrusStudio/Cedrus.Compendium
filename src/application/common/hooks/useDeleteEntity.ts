"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

type UseDeleteEntityConfig = 
{
  client: { delete: (id: string) => Promise<void> };
  queryKey: string[];
  redirectPath: string;
};

export function useDeleteEntity({ client, queryKey, redirectPath }: UseDeleteEntityConfig)
{
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate, isPending } = useMutation
  ({
    mutationFn: async (id: string) => await client.delete(id),
    onSuccess: () =>
    {
      queryClient.invalidateQueries({ queryKey });
      router.push(redirectPath);
    },
    onError: (error) => 
    {
      console.error(`Error deleting ${queryKey.join(', ')}:`, error);
    }
  });

  return { deleteEntity: mutate, isPending };
};
