"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/equipment/mountsClient";
import { useRouter } from 'next/navigation';

export const useDeleteMountById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (mountId: string) => await client.delete(mountId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['mounts'] });
            router.push('/compendium/equipment/mounts');
        },
        onError: (error) => 
        {
            console.error('Error deleting mount:', error);
        }
    });

    return { deleteMount: mutate, isPending }
};
