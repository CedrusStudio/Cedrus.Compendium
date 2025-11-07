"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/spellsClient";
import { useRouter } from 'next/navigation';

export const useDeleteSpellById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (spellId: string) => await client.delete(spellId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['spells'] });
            router.push('/compendium/spells');
        },
        onError: (error) => 
        {
            console.error('Error deleting spell:', error);
        }
    });

    return { deleteSpell: mutate, isPending }
};