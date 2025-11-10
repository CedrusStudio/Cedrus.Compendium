"use client";

import client from "@/infrastructure/clients/equipment/inventoryClient";
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";

export const useDeleteInventoryItemById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['inventory'],
        redirectPath: '/compendium/equipment/inventory'
    });

    return { deleteInventoryItem: deleteEntity, isPending };
};
