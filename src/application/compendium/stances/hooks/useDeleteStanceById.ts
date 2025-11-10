"use client";

import client from "@/infrastructure/clients/stancesClient";
import { useDeleteEntity } from '@/application/common/hooks/useDeleteEntity';

export const useDeleteStanceById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['stances'],
        redirectPath: '/compendium/stances'
    });

    return { deleteStance: deleteEntity, isPending }
};