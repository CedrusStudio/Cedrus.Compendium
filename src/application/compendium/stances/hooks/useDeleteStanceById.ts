"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/stancesClient";
import { useRouter } from 'next/navigation';

export const useDeleteStanceById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (stanceId: string) => await client.delete(stanceId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['stances'] });
            router.push('/compendium/stances');
        },
        onError: (error) => 
        {
            console.error('Error deleting stance:', error);
        }
    });

    return { deleteStance: mutate, isPending }
};