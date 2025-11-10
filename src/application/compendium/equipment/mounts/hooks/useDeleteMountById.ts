"use client";

import client from "@/infrastructure/clients/equipment/mountsClient";
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";

export const useDeleteMountById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['mounts'],
        redirectPath: '/compendium/equipment/mounts'
    });

    return { deleteMount: deleteEntity, isPending };
};
