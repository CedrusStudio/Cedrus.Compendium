"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/equipment/armorsClient";
import { useRouter } from 'next/navigation';

export const useDeleteArmorById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (armorId: string) => await client.delete(armorId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['armors'] });
            router.push('/compendium/equipment/armors');
        },
        onError: (error) => 
        {
            console.error('Error deleting armor:', error);
        }
    });

    return { deleteArmor: mutate, isPending }
};
