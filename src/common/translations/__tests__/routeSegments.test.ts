import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { displayedText } from '@/common/translations';

/**
 * Every static URL segment must have a translation.
 *
 * `NavbarBreadcrumb` falls back to the raw segment when a key is missing, so an
 * untranslated route does not crash — it just prints English in the middle of
 * a Polish breadcrumb ("start › kompendium › races"), which nobody notices
 * until they look. That is exactly the kind of silent gap worth a test rather
 * than vigilance: the list of routes grows, the translation file does not.
 *
 * Derived from the filesystem, not from a hand-kept list, so a new page is
 * covered the moment it exists.
 */

/** Directories that never appear in a URL. */
const isRoutePart = (name: string): boolean =>
  !name.startsWith('(')      // route group — invisible in the URL
  && !name.startsWith('[')   // dynamic segment — resolved at runtime
  && !name.startsWith('_')
  && name !== 'api'          // no breadcrumbs on API routes
  && name !== '__tests__'
  && name !== 'components';  // colocated components, not a route

function routeSegments(dir: string, found = new Set<string>()): Set<string>
{
  for (const entry of readdirSync(dir, { withFileTypes: true }))
  {
    if (!entry.isDirectory()) continue;

    const nested = join(dir, entry.name);
    // A route group contributes nothing itself but still holds real routes.
    if (isRoutePart(entry.name)) found.add(entry.name);
    if (!entry.name.startsWith('_') && entry.name !== 'api' && entry.name !== '__tests__') routeSegments(nested, found);
  }

  return found;
}

describe('breadcrumb translations', () => {
  it('covers every static route segment', () => {
    const segments = [...routeSegments(join(process.cwd(), 'src', 'app'))].sort();
    const missing = segments.filter(segment => displayedText[segment as keyof typeof displayedText] === undefined);

    expect(missing).toEqual([]);
  });

  it('actually walks the tree — a guard against the check silently finding nothing', () => {
    const segments = routeSegments(join(process.cwd(), 'src', 'app'));

    expect(segments.has('compendium')).toBe(true);
    expect(segments.has('races')).toBe(true);
    // Grupy tras i segmenty dynamiczne nie trafiają do URL-a, więc nie mogą
    // wymuszać tłumaczeń — inaczej test kazałby tłumaczyć „[id]".
    expect([...segments].some(segment => segment.startsWith('(') || segment.startsWith('['))).toBe(false);
  });
});
