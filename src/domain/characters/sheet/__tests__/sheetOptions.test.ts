import { describe, expect, it } from 'vitest';
import {
  defaultSheetOptions,
  isSectionEnabled,
  isSheetSection,
  parseSheetOptions,
  sheetSections,
  toSheetQuery,
} from '@/domain/characters/sheet/sheetOptions';

describe('parseSheetOptions', () =>
{
  it('enables every section when nothing is requested', () =>
  {
    expect(parseSheetOptions(undefined)).toEqual(defaultSheetOptions);
    expect(parseSheetOptions({})).toEqual(defaultSheetOptions);
  });

  it('keeps requested sections in canonical order, not the order given', () =>
  {
    const options = parseSheetOptions({ sections: 'talents,stats' });

    expect(options.sections).toEqual(['stats', 'talents']);
  });

  it('ignores unknown section names', () =>
  {
    expect(parseSheetOptions({ sections: 'stats,nieistniejaca' }).sections).toEqual(['stats']);
  });

  it('falls back to every section when the list is entirely unrecognised', () =>
  {
    // A broken link, not a choice — an empty sheet would look like a bug.
    expect(parseSheetOptions({ sections: 'zupelnie-nieznana' }).sections).toEqual(defaultSheetOptions.sections);
  });

  it('respects an explicitly empty list', () =>
  {
    // The toolbar emits this when the last checkbox is cleared; falling back to
    // everything would switch all sections back on at that exact moment.
    expect(parseSheetOptions({ sections: '' }).sections).toEqual([]);
    expect(parseSheetOptions({ sections: '   ' }).sections).toEqual([]);
  });

  it('reads the appendix flag in its accepted spellings', () =>
  {
    expect(parseSheetOptions({ appendix: '1' }).appendix).toBe(true);
    expect(parseSheetOptions({ appendix: 'true' }).appendix).toBe(true);
    expect(parseSheetOptions({ appendix: 'TAK' }).appendix).toBe(true);
    expect(parseSheetOptions({ appendix: '0' }).appendix).toBe(false);
    expect(parseSheetOptions({}).appendix).toBe(false);
  });

  it('takes the first value of a repeated parameter', () =>
  {
    expect(parseSheetOptions({ sections: ['stats', 'talents'] }).sections).toEqual(['stats']);
  });

  it('enables symbols only explicitly and accepts the first repeated value', () =>
  {
    expect(parseSheetOptions({}).symbolsOnly).toBe(false);
    expect(parseSheetOptions({ symbolsOnly: '1' }).symbolsOnly).toBe(true);
    expect(parseSheetOptions({ symbolsOnly: 'true' }).symbolsOnly).toBe(true);
    expect(parseSheetOptions({ symbolsOnly: '0' }).symbolsOnly).toBe(false);
    expect(parseSheetOptions({ symbolsOnly: 'unknown' }).symbolsOnly).toBe(false);
    expect(parseSheetOptions({ symbolsOnly: ['1', '0'] }).symbolsOnly).toBe(true);
  });
});

describe('toSheetQuery', () =>
{
  it('emits nothing for the defaults', () =>
  {
    expect(toSheetQuery(defaultSheetOptions)).toBe('');
  });

  it('serialises sections in canonical order', () =>
  {
    expect(toSheetQuery({ sections: ['talents', 'stats'], appendix: true }))
      .toBe('?sections=stats%2Ctalents&appendix=1');
  });

  it('round-trips through parseSheetOptions', () =>
  {
    const options = { sections: ['vitals', 'powers'] as const, appendix: true, symbolsOnly: true };
    const query = new URLSearchParams(toSheetQuery(options).slice(1));

    expect(parseSheetOptions(Object.fromEntries(query))).toEqual({ sections: ['vitals', 'powers'], appendix: true, symbolsOnly: true });
  });
});

describe('section helpers', () =>
{
  it('recognises known section names', () =>
  {
    expect(isSheetSection('stats')).toBe(true);
    expect(isSheetSection('nope')).toBe(false);
  });

  it('reports whether a section is enabled', () =>
  {
    const options = { sections: ['stats' as const], appendix: false };

    expect(isSectionEnabled(options, 'stats')).toBe(true);
    expect(isSectionEnabled(options, 'talents')).toBe(false);
  });

  it('labels every section', () =>
  {
    expect(sheetSections.every(section => isSheetSection(section))).toBe(true);
  });
});
