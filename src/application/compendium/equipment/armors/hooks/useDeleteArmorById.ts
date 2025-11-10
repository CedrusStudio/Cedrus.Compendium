"use client";

import client from "@/infrastructure/clients/equipment/armorsClient";
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";

export const useDeleteArmorById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['armors'],
        redirectPath: '/compendium/equipment/armors'
    });

    return { deleteArmor: deleteEntity, isPending };
};
