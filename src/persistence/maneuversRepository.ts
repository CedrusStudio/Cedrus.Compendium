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

export async function searchManeuvers(name: string | undefined | null)
  : Promise<Maneuver[]>
{
  const maneuvers = await prisma.maneuver.findMany
  ({
    where: {
      name: name ? {
        contains: name,
        mode: 'insensitive'
      } : undefined
    },
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
export async function updateManeuver(id: string, maneuver: ManeuverDto)
  : Promise<boolean>
{
  const { id: _, ...maneuverWithoutId } = maneuver;

  const updatedManeuver = await prisma.maneuver.update
  ({
    where: { id },
    data: maneuverWithoutId
  });
  
  return !!updatedManeuver;
}