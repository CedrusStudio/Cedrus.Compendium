'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from "@/lib/prisma";
import { ModeDto } from "@/persistence/schemas/characters/combat/modeSchema";

//Commands
export async function deleteState(id: string)
  : Promise<void>
{
  await prisma.state.delete
  ({
    where: { id }
  });
}

export async function addState(state: ModeDto)
  : Promise<string>
{
  const added = await prisma.state.create
  ({
    data: state
  });

  return added.id;
}

export async function updateState(state: ModeDto)
  : Promise<boolean>
{
  const { id: id, ...stateWithoutId } = state;

  const updatedState = await prisma.state.update
  ({
    where: { id },
    data: stateWithoutId
  });
  
  return !!updatedState;
}