'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from "@/lib/prisma";
import { PerkDto } from "@/persistence/schemas/characters/perkSchema";

//Commands
export async function deletePerk(id: string)
  : Promise<void>
{
  await prisma.perk.delete
  ({
    where: { id }
  });
}

export async function addPerk(perk: PerkDto)
  : Promise<string>
{
  const added = await prisma.perk.create
  ({
    data: perk
  });

  return added.id;
}

export async function updatePerk(perk: PerkDto)
  : Promise<boolean>
{
  const { id: id, ...perkWithoutId } = perk;

  const updatedPerk = await prisma.perk.update
  ({
    where: { id },
    data: perkWithoutId
  });
  
  return !!updatedPerk;
}