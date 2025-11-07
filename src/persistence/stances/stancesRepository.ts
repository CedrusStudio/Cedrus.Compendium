'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from "@/lib/prisma";
import { ModeDto } from "@/persistence/schemas/characters/combat/modeSchema";

//Commands
export async function deleteStance(id: string)
  : Promise<void>
{
  await prisma.stance.delete
  ({
    where: { id }
  });
}

export async function addStance(stance: ModeDto)
  : Promise<string>
{
  const added = await prisma.stance.create
  ({
    data: stance
  });

  return added.id;
}

export async function updateStance(stance: ModeDto)
  : Promise<boolean>
{
  const { id: id, ...stanceWithoutId } = stance;

  const updatedStance = await prisma.stance.update
  ({
    where: { id },
    data: stanceWithoutId
  });
  
  return !!updatedStance;
}