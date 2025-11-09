'use server';

import 'server-only';
import prisma from "@/lib/prisma";
import { ArmorDto } from "@/persistence/schemas/characters/equipment/armorSchema";

export async function deleteArmor(id: string)
  : Promise<void>
{
  await prisma.armor.delete
  ({
    where: { id }
  });
}

export async function addArmor(armor: ArmorDto)
  : Promise<string>
{
  const added = await prisma.armor.create
  ({
    data: armor
  });

  return added.id;
}

export async function updateArmor(armor: ArmorDto)
  : Promise<boolean>
{
  const { id: id, ...armorWithoutId } = armor;

  const updatedArmor = await prisma.armor.update
  ({
    where: { id },
    data: armorWithoutId
  });
  
  return !!updatedArmor;
}
