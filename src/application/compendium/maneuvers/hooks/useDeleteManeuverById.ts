"use client";

import client from "@/infrastructure/clients/maneuversClient";
import { useDeleteEntity } from '@/application/common/hooks/useDeleteEntity';

export const useDeleteManeuverById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['maneuvers'],
        redirectPath: '/compendium/maneuvers'
    });

    return { deleteManeuver: deleteEntity, isPending }
};