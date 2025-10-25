"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/maneuversClient";
import { useRouter } from 'next/navigation';

export const useDeleteManeuverById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (maneuverId: string) => await client.delete(maneuverId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['maneuvers'] });
            router.push('/compendium/maneuvers');
        },
        onError: (error) => 
        {
            console.error('Error deleting maneuver:', error);
        }
    });

    return { deleteManeuver: mutate, isPending }
};