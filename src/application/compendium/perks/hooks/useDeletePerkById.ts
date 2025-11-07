"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/perksClient";
import { useRouter } from 'next/navigation';

export const useDeletePerkById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (perkId: string) => await client.delete(perkId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['perks'] });
            router.push('/compendium/perks');
        },
        onError: (error) => 
        {
            console.error('Error deleting perk:', error);
        }
    });

    return { deletePerk: mutate, isPending }
};