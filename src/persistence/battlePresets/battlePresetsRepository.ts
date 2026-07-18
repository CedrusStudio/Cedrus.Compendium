'use server';

//Tip: mark your repository as server-only so it can't be imported in client components by mistake.
import 'server-only';
import prisma from '@/lib/prisma';
import { BattleConfiguration } from '@/domain/battlePresets/BattleConfiguration';
import { BattlePreset, BattlePresetSummary } from '@/domain/battlePresets/BattlePreset';
import { toBattlePreset } from '@/persistence/battlePresets/battlePresetMapping';
import { BattlePresetNotFoundError, BattlePresetValidationError } from '@/persistence/battlePresets/battlePresetErrors';

// Recommendation from the source feature document (Weryfikacja 3), see
// battle-configurations-implementation-plan.md — not exported, since a
// 'use server' file may only export async functions.
const MAX_BATTLE_PRESETS_PER_API_KEY = 100;

//Queries

export async function getBattlePresetSummariesForApiKey(apiKeyHash: string)
  : Promise<BattlePresetSummary[]>
{
  const records = await prisma.battlePreset.findMany
  ({
    where: { apiKeyHash },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });

  return records;
}

/**
 * Single-record lookup scoped to the requesting API key. Prisma/Mongo
 * `findUnique` can't combine an extra `where` condition with the unique key
 * lookup, so ownership is checked in-memory after the fetch — same approach
 * as `searchEntityById` for character visibility (see
 * visible-only-to-api-keys-implementation-plan.md, Etap 3). Returns `null`
 * both when the id doesn't exist and when it belongs to another API key, so
 * callers can't distinguish "missing" from "someone else's" (see Etap 8 /
 * "Otwarte pytania" question 2 in the implementation plan).
 */
export async function getBattlePresetById(id: string, apiKeyHash: string)
  : Promise<BattlePreset | null>
{
  const record = await prisma.battlePreset.findUnique({ where: { id } });

  if (!record || record.apiKeyHash !== apiKeyHash) return null;

  return toBattlePreset(record);
}

//Commands

export async function addBattlePreset(apiKeyHash: string, name: string, configuration: BattleConfiguration)
  : Promise<string>
{
  const existingCount = await prisma.battlePreset.count({ where: { apiKeyHash } });

  if (existingCount >= MAX_BATTLE_PRESETS_PER_API_KEY)
  {
    throw new BattlePresetValidationError(`Battle preset limit reached (${MAX_BATTLE_PRESETS_PER_API_KEY} per API key).`);
  }

  const created = await prisma.battlePreset.create
  ({
    data: { name, apiKeyHash, configuration },
  });

  return created.id;
}

/**
 * Verifies ownership before updating — a preset id known to caller B must
 * not be overwritable just because B guessed/observed the id. Throws
 * BattlePresetNotFoundError (not a boolean `false`) so route handlers can
 * return a 404 consistently with getBattlePresetById/deleteBattlePreset.
 */
export async function updateBattlePreset(id: string, apiKeyHash: string, data: { name?: string; configuration?: BattleConfiguration })
  : Promise<BattlePreset>
{
  const existing = await prisma.battlePreset.findUnique({ where: { id } });

  if (!existing || existing.apiKeyHash !== apiKeyHash)
  {
    throw new BattlePresetNotFoundError(id);
  }

  const updated = await prisma.battlePreset.update
  ({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.configuration !== undefined ? { configuration: data.configuration } : {}),
    },
  });

  return toBattlePreset(updated);
}

/**
 * Verifies ownership before deleting, for the same reason as
 * updateBattlePreset — deletion by a guessed/observed id must not succeed
 * for a preset owned by a different API key.
 */
export async function deleteBattlePreset(id: string, apiKeyHash: string)
  : Promise<void>
{
  const existing = await prisma.battlePreset.findUnique({ where: { id } });

  if (!existing || existing.apiKeyHash !== apiKeyHash)
  {
    throw new BattlePresetNotFoundError(id);
  }

  await prisma.battlePreset.delete({ where: { id } });
}
