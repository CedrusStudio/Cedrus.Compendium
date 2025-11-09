'use server';

import 'server-only';
import prisma from "@/lib/prisma";
import { WeaponDto } from "@/persistence/schemas/characters/equipment/weaponSchema";

export async function deleteWeapon(id: string)
  : Promise<void>
{
  await prisma.weapon.delete
  ({
    where: { id }
  });
}

export async function addWeapon(weapon: WeaponDto)
  : Promise<string>
{
  const added = await prisma.weapon.create
  ({
    data: weapon
  });

  return added.id;
}

export async function updateWeapon(weapon: WeaponDto)
  : Promise<boolean>
{
  const { id: id, ...weaponWithoutId } = weapon;

  const updatedWeapon = await prisma.weapon.update
  ({
    where: { id },
    data: weaponWithoutId
  });
  
  return !!updatedWeapon;
}
