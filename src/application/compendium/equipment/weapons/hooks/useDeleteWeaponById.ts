"use client";

import client from "@/infrastructure/clients/equipment/weaponsClient";
import { useDeleteEntity } from "@/application/common/hooks/useDeleteEntity";

export const useDeleteWeaponById = () => 
{
  const { deleteEntity, isPending } = useDeleteEntity
  ({
    client: client,
    queryKey: ['weapons'],
    redirectPath: '/compendium/equipment/weapons'
  });

  return { deleteWeapon: deleteEntity, isPending };
};
