'use server';

import 'server-only';
import prisma from "@/lib/prisma";
import { MountDto } from "@/persistence/schemas/characters/equipment/mountSchema";

export async function deleteMount(id: string)
  : Promise<void>
{
  await prisma.mount.delete
  ({
    where: { id }
  });
}

export async function addMount(mount: MountDto)
  : Promise<string>
{
  const added = await prisma.mount.create
  ({
    data: mount
  });

  return added.id;
}

export async function updateMount(mount: MountDto)
  : Promise<boolean>
{
  const { id: id, ...mountWithoutId } = mount;

  const updatedMount = await prisma.mount.update
  ({
    where: { id },
    data: mountWithoutId
  });
  
  return !!updatedMount;
}
