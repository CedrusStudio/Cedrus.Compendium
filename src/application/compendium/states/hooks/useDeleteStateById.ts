"use client";

import client from "@/infrastructure/clients/statesClient";
import { useDeleteEntity } from '@/application/common/hooks/useDeleteEntity';

export const useDeleteStateById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['states'],
        redirectPath: '/compendium/states'
    });

    return { deleteState: deleteEntity, isPending }
};