"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/statesClient";
import { useRouter } from 'next/navigation';

export const useDeleteStateById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (stateId: string) => await client.delete(stateId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['states'] });
            router.push('/compendium/states');
        },
        onError: (error) => 
        {
            console.error('Error deleting state:', error);
        }
    });

    return { deleteState: mutate, isPending }
};