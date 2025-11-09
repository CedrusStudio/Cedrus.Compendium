"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/equipment/weaponsClient";
import { useRouter } from 'next/navigation';

export const useDeleteWeaponById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (weaponId: string) => await client.delete(weaponId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['weapons'] });
            router.push('/compendium/equipment/weapons');
        },
        onError: (error) => 
        {
            console.error('Error deleting weapon:', error);
        }
    });

    return { deleteWeapon: mutate, isPending }
};
