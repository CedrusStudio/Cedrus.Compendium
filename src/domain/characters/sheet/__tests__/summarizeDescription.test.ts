import { describe, expect, it } from 'vitest';
import { summarizeDescription } from '@/domain/characters/sheet/summarizeDescription';

describe('summarizeDescription', () =>
{
  it('keeps only the first sentence', () =>
  {
    expect(summarizeDescription('Pierwsze zdanie opisu. Drugie zdanie, którego nie chcemy.'))
      .toBe('Pierwsze zdanie opisu.');
  });

  it('returns text without a sentence end unchanged', () =>
  {
    expect(summarizeDescription('Krótki opis bez kropki')).toBe('Krótki opis bez kropki');
  });

  it('skips blank lines and takes the first real paragraph', () =>
  {
    expect(summarizeDescription('\n\n  Akapit po pustych liniach. Reszta.\nDrugi akapit.'))
      .toBe('Akapit po pustych liniach.');
  });

  it('does not treat a Polish abbreviation as a sentence end', () =>
  {
    // "np." is followed by a lowercase word, so it cannot start a new sentence.
    expect(summarizeDescription('Działa np. wtedy, gdy przeciwnik jest zaskoczony. Inaczej nie.'))
      .toBe('Działa np. wtedy, gdy przeciwnik jest zaskoczony.');

    expect(summarizeDescription('Obejmuje m.in. sojuszników w zasięgu. Nie działa na wrogów.'))
      .toBe('Obejmuje m.in. sojuszników w zasięgu.');
  });

  it('collapses internal whitespace', () =>
  {
    expect(summarizeDescription('Dużo    spacji\ti tabulatorów')).toBe('Dużo spacji i tabulatorów');
  });

  it('truncates at a word boundary and marks the cut', () =>
  {
    const summary = summarizeDescription('Alfa beta gamma delta epsilon dzeta eta theta', 20);

    expect(summary.endsWith('…')).toBe(true);
    expect(summary.length).toBeLessThanOrEqual(21);
    expect(summary).toBe('Alfa beta gamma…');
  });

  it('drops trailing punctuation left behind by the cut', () =>
  {
    expect(summarizeDescription('Alfa beta, gamma delta epsilon', 12)).toBe('Alfa beta…');
  });

  it('handles missing descriptions', () =>
  {
    expect(summarizeDescription('')).toBe('');
    expect(summarizeDescription(null)).toBe('');
    expect(summarizeDescription(undefined)).toBe('');
    expect(summarizeDescription('   \n  ')).toBe('');
  });

  it('does not cut on a leading list marker', () =>
  {
    // "1." satisfies the sentence-end rule but is too short to be a summary.
    expect(summarizeDescription('1. Pierwszy krok. Drugi krok.')).toBe('1. Pierwszy krok.');
  });

  it('returns nothing for a non-positive limit', () =>
  {
    expect(summarizeDescription('Cokolwiek tutaj jest', 0)).toBe('');
  });
});
