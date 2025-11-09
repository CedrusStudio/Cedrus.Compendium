"use client";

import { useMutation, useQueryClient  } from '@tanstack/react-query';
import client from "@/infrastructure/clients/equipment/inventoryClient";
import { useRouter } from 'next/navigation';

export const useDeleteInventoryItemById = () => 
{
    const queryClient = useQueryClient();
    const router = useRouter();

    const { mutate, isPending } = useMutation
    ({
        mutationFn: async (itemId: string) => await client.delete(itemId),
        onSuccess: () =>
        {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            router.push('/compendium/equipment/inventory');
        },
        onError: (error) => 
        {
            console.error('Error deleting inventory item:', error);
        }
    });

    return { deleteInventoryItem: mutate, isPending }
};
