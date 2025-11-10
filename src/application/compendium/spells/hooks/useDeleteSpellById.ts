"use client";

import client from "@/infrastructure/clients/spellsClient";
import { useDeleteEntity } from '@/application/common/hooks/useDeleteEntity';

export const useDeleteSpellById = () => 
{
    const { deleteEntity, isPending } = useDeleteEntity
    ({
        client: client,
        queryKey: ['spells'],
        redirectPath: '/compendium/spells'
    });

    return { deleteSpell: deleteEntity, isPending }
};