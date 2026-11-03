import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Canonical distribution source: Cedrus.Templates/eng/ai/verify-ai-guidance.mjs.
// Meta adoption v1, offline integrity only. Pinned-source authenticity is a Meta audit.
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const entryFields = ['id', 'sourceRepository', 'sourceRevision', 'sourcePath', 'sourceSection',
  'destinationPath', 'destinationBlock', 'substitutions', 'sourceSha256', 'renderedSha256'];

function requireValue(condition, message)
{
  if (!condition) throw new Error(message);
}

function shape(value, fields)
{
  requireValue(value !== null && typeof value === 'object' && !Array.isArray(value), 'Expected JSON record.');
  requireValue(Object.keys(value).length === fields.length && fields.every(field => Object.hasOwn(value, field)), 'Unknown or missing manifest field.');
}

function relative(value)
{
  requireValue(typeof value === 'string' && value.length > 0 && !/[\\:]/.test(value) &&
    value.split('/').every(part => part && part !== '.' && part !== '..' && part.toLowerCase() !== '.git'), 'Unsafe owner-relative path.');
}

function resolveFile(root, value)
{
  relative(value);
  let current = root;
  for (const part of value.split('/'))
  {
    requireValue(fs.readdirSync(current).includes(part), `Missing path or incorrect casing: ${value}`);
    current = path.join(current, part);
    requireValue(!fs.lstatSync(current).isSymbolicLink(), `Linked instruction path: ${value}`);
  }
  requireValue(fs.statSync(current).isFile(), `Expected file: ${value}`);
  return current;
}

function readText(file)
{
  return new TextDecoder('utf-8', { fatal: true }).decode(fs.readFileSync(file));
}

function normalize(text)
{
  return text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
}

function block(text, id)
{
  const starts = [...text.matchAll(new RegExp(`^<!-- cedrus:managed ${id}:start -->\\r?$`, 'gm'))];
  const ends = [...text.matchAll(new RegExp(`^<!-- cedrus:managed ${id}:end -->\\r?$`, 'gm'))];
  requireValue(starts.length === 1 && ends.length === 1, `Expected one managed marker pair: ${id}`);
  const start = starts[0].index + starts[0][0].length;
  requireValue(text[start] === '\n' && ends[0].index > start, 'Reversed or incomplete managed markers.');
  const body = text.slice(start + 1, ends[0].index);
  requireValue(!body.includes('<!-- cedrus:'), 'Nested managed markers.');
  return body;
}

function withoutFences(text)
{
  return normalize(text).replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[^\n]*(?:\n|$)/gm, '');
}

function checkLinks(root, file, text, queue)
{
  for (const match of withoutFences(text).matchAll(/\[[^\]\n]+\]\(([^)\n]+)\)/g))
  {
    const link = match[1];
    if (/^(https?:|mailto:)/i.test(link)) continue;
    const [location, fragment] = link.split('#', 2);
    const target = location ? path.resolve(path.dirname(file), decodeURIComponent(location)) : file;
    const ownerRelative = path.relative(root, target).split(path.sep).join('/');
    resolveFile(root, ownerRelative);
    if (fragment)
    {
      const anchor = decodeURIComponent(fragment);
      const linked = withoutFences(readText(target));
      const headings = [...linked.matchAll(/^#+ (.+)$/gm)].map(header => header[1].trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/ /g, '-'));
      requireValue(linked.includes(`id="${anchor}"`) || headings.includes(anchor), `Missing local anchor: ${ownerRelative}#${anchor}`);
    }
    if (target.endsWith('.md')) queue.add(ownerRelative);
  }
}

export function validate(root)
{
  root = path.resolve(root);
  requireValue(fs.lstatSync(root).isDirectory() && !fs.lstatSync(root).isSymbolicLink(), 'Invalid consumer root.');
  const manifest = JSON.parse(readText(resolveFile(root, 'ai/adoption.json')));
  shape(manifest, ['schemaVersion', 'documentKind', 'items']);
  requireValue(manifest.schemaVersion === 1 && manifest.documentKind === 'adoption' && Array.isArray(manifest.items) && manifest.items.length > 0, 'Invalid adoption protocol/version.');
  const ids = new Set();
  const owners = new Map();
  const queue = new Set(['AGENTS.md', 'CLAUDE.md', '.github/copilot-instructions.md', 'README.md', 'docs/development.md']);
  for (const legacy of ['SystemPrompt.md', 'ApplicationContext.md'])
  {
    if (fs.existsSync(path.join(root, legacy))) queue.add(legacy);
  }
  for (const entry of manifest.items)
  {
    shape(entry, entryFields);
    requireValue(typeof entry.id === 'string' && idPattern.test(entry.id) && !ids.has(entry.id), 'Duplicate/invalid adopted ID.');
    ids.add(entry.id);
    requireValue(typeof entry.sourceRepository === 'string' && idPattern.test(entry.sourceRepository) && typeof entry.sourceRevision === 'string' && /^[a-f0-9]{40}$/.test(entry.sourceRevision), 'Missing source identity.');
    for (const digest of [entry.sourceSha256, entry.renderedSha256])
    {
      requireValue(typeof digest === 'string' && /^[a-f0-9]{64}$/.test(digest), 'Invalid source/rendered digest.');
    }
    relative(entry.sourcePath);
    relative(entry.destinationPath);
    requireValue(entry.sourcePath.endsWith('.md') && entry.destinationPath.endsWith('.md'), 'Adoption owns Markdown only.');
    for (const marker of [entry.sourceSection, entry.destinationBlock])
    {
      requireValue(marker === null || typeof marker === 'string' && idPattern.test(marker), 'Invalid marker ID.');
    }
    requireValue(Array.isArray(entry.substitutions) && entry.substitutions.length <= 1, 'Unknown projection.');
    for (const substitution of entry.substitutions)
    {
      shape(substitution, ['from', 'to']);
      requireValue(substitution.from === 'docs/development.md' && substitution.to === 'docs/code-style.md' ||
        substitution.from === 'docs/code-style.md' && substitution.to === 'docs/development.md', 'Unknown local link substitution.');
    }
    const key = entry.destinationPath.toLowerCase();
    const blocks = owners.get(key) ?? new Set();
    const owner = entry.destinationBlock ?? '*';
    requireValue(!blocks.has(owner) && !blocks.has('*') && (owner !== '*' || blocks.size === 0), 'Overlapping adopted destinations.');
    blocks.add(owner);
    owners.set(key, blocks);
    const file = resolveFile(root, entry.destinationPath);
    const text = readText(file);
    const owned = entry.destinationBlock === null ? text : block(text, entry.destinationBlock);
    const digest = createHash('sha256').update(normalize(owned), 'utf8').digest('hex');
    requireValue(digest === entry.renderedSha256, `Adopted content drift: ${entry.id}`);
    queue.add(entry.destinationPath);
  }
  requireValue(readText(resolveFile(root, 'CLAUDE.md')).trim() === '@AGENTS.md', 'Claude adapter must import local AGENTS.md.');
  const checked = new Set();
  for (const relativePath of queue)
  {
    if (checked.has(relativePath)) continue;
    checked.add(relativePath);
    const file = resolveFile(root, relativePath);
    checkLinks(root, file, readText(file), queue);
  }
  return { entries: manifest.items.length, documents: checked.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
{
  try
  {
    requireValue(process.argv.length <= 3, 'Usage: verify-ai-guidance.mjs [consumer-root]');
    const result = validate(process.argv[2] ?? process.cwd());
    console.log(`PASS offline AI guidance: ${result.entries} adoption entries, ${result.documents} linked documents; no dependencies, source checkout or network required.`);
  }
  catch (error)
  {
    console.error(`AI guidance: ${error.message}`);
    process.exitCode = 1;
  }
}
