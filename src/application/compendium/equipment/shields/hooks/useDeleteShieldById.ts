"use client";

import client from "@/infrastructure/clients/equipment/shieldsClient";
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";

export const useDeleteShieldById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['shields'],
        redirectPath: '/compendium/equipment/shields'
    });

    return { deleteShield: deleteEntity, isPending };
};
