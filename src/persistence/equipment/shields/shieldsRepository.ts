'use server';

import 'server-only';
import prisma from "@/lib/prisma";
import { ShieldDto } from "@/persistence/schemas/characters/equipment/shieldSchema";

export async function deleteShield(id: string)
  : Promise<void>
{
  await prisma.shield.delete
  ({
    where: { id }
  });
}

export async function addShield(shield: ShieldDto)
  : Promise<string>
{
  const added = await prisma.shield.create
  ({
    data: shield
  });

  return added.id;
}

export async function updateShield(shield: ShieldDto)
  : Promise<boolean>
{
  const { id: id, ...shieldWithoutId } = shield;

  const updatedShield = await prisma.shield.update
  ({
    where: { id },
    data: shieldWithoutId
  });
  
  return !!updatedShield;
}
