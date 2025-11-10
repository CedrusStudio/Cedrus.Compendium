"use client";

import client from "@/infrastructure/clients/perksClient";
import { useDeleteEntity } from '@/application/common/hooks/useDeleteEntity';

export const useDeletePerkById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['perks'],
        redirectPath: '/compendium/perks'
    });

    return { deletePerk: deleteEntity, isPending }
};