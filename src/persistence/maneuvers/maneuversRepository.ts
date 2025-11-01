'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from "@/lib/prisma";
import { ManeuverDto } from "@/persistence/schemas/characters/combat/maneuverSchema";

//Commands
export async function deleteManeuver(id: string)
  : Promise<void>
{
  await prisma.maneuver.delete
  ({
    where: { id }
  });
}

export async function addManeuver(maneuver: ManeuverDto)
  : Promise<string>
{
  const added = await prisma.maneuver.create
  ({
    data: maneuver
  });

  return added.id;
}

export async function updateManeuver(maneuver: ManeuverDto)
  : Promise<boolean>
{
  const { id: id, ...maneuverWithoutId } = maneuver;

  const updatedManeuver = await prisma.maneuver.update
  ({
    where: { id },
    data: maneuverWithoutId
  });
  
  return !!updatedManeuver;
}