/**
 * Backup MongoDB Atlas (M0) data via Prisma.
 *
 * Exports every Prisma model to its own JSON file, mirroring the approach
 * described in features-to-implement/Backup_MongoDB_Atlas_M0.md. Works on
 * the M0 (free/shared) tier because it reads through the app's own Prisma
 * connection instead of requiring `mongodump` / admin privileges.
 *
 * The list of collections to back up is read from the Prisma DMMF at
 * runtime, so newly added models are picked up automatically without
 * touching this script.
 *
 * Usage:
 *   npx tsx scripts/backup-mongodb.ts
 *   npx tsx scripts/backup-mongodb.ts --out=my-backups
 *
 * Output:
 *   backup/<timestamp>/
 *   ├── Character.json
 *   ├── Race.json
 *   ├── ...
 *   └── _manifest.json
 *
 * Note (same caveat as the source doc): this preserves values, not raw BSON
 * types (e.g. Dates come out as ISO strings). Restoring requires a matching
 * import script or `mongoimport`.
 */

import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import prisma from '../src/lib/prisma';

type PrismaDelegate = {
  findMany: (args?: unknown) => Promise<unknown[]>;
};

type CollectionResult = {
  model: string;
  count: number;
  file: string;
};

function toDelegateName(modelName: string): string
{
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function resolveOutputRoot(): string
{
  const outArg = process.argv.find((arg) => arg.startsWith('--out='));
  const baseDir = outArg ? outArg.slice('--out='.length) : 'backup';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(process.cwd(), baseDir, timestamp);
}

async function backupModel(modelName: string, outputRoot: string): Promise<CollectionResult>
{
  const delegateName = toDelegateName(modelName);
  const delegate = (prisma as unknown as Record<string, PrismaDelegate>)[delegateName];

  if (!delegate || typeof delegate.findMany !== 'function')
  {
    throw new Error(`No Prisma delegate found for model "${modelName}" (expected prisma.${delegateName}).`);
  }

  const records = await delegate.findMany();
  const file = path.join(outputRoot, `${modelName}.json`);

  fs.writeFileSync(file, JSON.stringify(records, null, 2));

  return { model: modelName, count: records.length, file };
}

async function main(): Promise<void>
{
  const outputRoot = resolveOutputRoot();
  fs.mkdirSync(outputRoot, { recursive: true });

  const modelNames = Prisma.dmmf.datamodel.models.map((model) => model.name);

  console.log(`Backing up ${modelNames.length} collection(s) to ${outputRoot}`);

  const results: CollectionResult[] = [];

  for (const modelName of modelNames)
  {
    const result = await backupModel(modelName, outputRoot);
    console.log(`  - ${result.model}: ${result.count} document(s) -> ${path.relative(process.cwd(), result.file)}`);
    results.push(result);
  }

  const manifest = {
    createdAt: new Date().toISOString(),
    totalDocuments: results.reduce((sum, result) => sum + result.count, 0),
    collections: results.map(({ model, count }) => ({ model, count })),
  };

  fs.writeFileSync(path.join(outputRoot, '_manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('');
  console.log(`Done. ${manifest.totalDocuments} document(s) across ${results.length} collection(s).`);
}

main()
  .catch((error) => {
    console.error('Backup failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
