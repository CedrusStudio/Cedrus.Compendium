'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import { Maneuver } from "@/domain/characters/combat/Maneuver";
import prisma from "@/lib/prisma";
import { toCastablePerk } from "@/persistence/mappings/characterMapping";
import { ManeuverDto } from "@/persistence/schemas/characters/combat/maneuverSchema";

//Queries
export async function getManeuverById(id: string)
  : Promise<Maneuver | null>
{
  const maneuver = await prisma.maneuver.findUnique
  ({ 
    where: { id }
  });

  return maneuver ? toCastablePerk(maneuver) : null;
}

export async function searchManeuvers(search: string | undefined | null, sort: string | undefined | null)
  : Promise<Maneuver[]>
{
  const maneuvers = await prisma.maneuver.findMany
  ({
    where: {
      name: search ? {
        contains: search,
        mode: 'insensitive'
      } : undefined
    },
    orderBy: sort ? {
      [sort]: 'asc'
    } : undefined
  });

  return maneuvers.map(toCastablePerk);
}

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