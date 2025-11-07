'use server';

//Tip: mark your repository as server-only so it can’t be imported in client components by mistake.
import 'server-only';
import prisma from "@/lib/prisma";
import { SpellDto } from "@/persistence/schemas/characters/combat/powerSchema";

//Commands
export async function deleteSpell(id: string)
  : Promise<void>
{
  await prisma.spell.delete
  ({
    where: { id }
  });
}

export async function addSpell(spell: SpellDto)
  : Promise<string>
{
  const added = await prisma.spell.create
  ({
    data: spell
  });

  return added.id;
}

export async function updateSpell(spell: SpellDto)
  : Promise<boolean>
{
  const { id: id, ...spellWithoutId } = spell;

  const updatedSpell = await prisma.spell.update
  ({
    where: { id },
    data: spellWithoutId
  });
  
  return !!updatedSpell;
}