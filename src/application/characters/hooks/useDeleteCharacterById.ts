"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import bffClient from '@/infrastructure/bffClient';
import { useRouter } from 'next/navigation';

export const useDeleteCharacterById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (characterId: string) => await bffClient.deleteCharacterById(characterId),
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