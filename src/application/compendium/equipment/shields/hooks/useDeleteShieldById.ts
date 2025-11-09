"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/equipment/shieldsClient";
import { useRouter } from 'next/navigation';

export const useDeleteShieldById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (shieldId: string) => await client.delete(shieldId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['shields'] });
            router.push('/compendium/equipment/shields');
        },
        onError: (error) => 
        {
            console.error('Error deleting shield:', error);
        }
    });

    return { deleteShield: mutate, isPending }
};
