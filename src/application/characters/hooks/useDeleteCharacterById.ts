"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/charactersClient";
import { useRouter } from 'next/navigation';

export const useDeleteCharacterById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterId: string) => await client.delete(characterId),
        onSuccess: () => 
        {
            queryClient.invalidateQueries({ queryKey: ['characters'] });
            router.push('/characters');
        },
        onError: (error) => 
        {
            console.error('Error deleting character:', error);
        }
    });

    return { deleteCharacter: mutate, isPending }
};