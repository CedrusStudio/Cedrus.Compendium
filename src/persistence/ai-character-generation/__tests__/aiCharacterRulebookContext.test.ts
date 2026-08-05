import { afterEach, describe, expect, it, vi } from 'vitest';

const { loadAllSections } = vi.hoisted(() => ({ loadAllSections: vi.fn() }));

vi.mock('@/persistence/rulebook/rulebookLoader', () => ({ loadAllSections }));

import { loadAiCharacterRulebookFragments } from '@/persistence/ai-character-generation/aiCharacterRulebookContext';

/**
 * Mirrors the real shape: most of the rulebook keeps its substance in
 * subsections, with nothing at the section level at all.
 */
const skillPointsSection = {
  id: 'section-podstawy-punkty-umiejetnosci',
  slug: 'punkty-umiejetnosci',
  title: 'Punkty Umiejętności',
  category: 'podstawy',
  order: 6,
  content: [],
  subsections: [
    {
      id: 'subsection-koszt-rozwoju-umiejetnosci',
      title: 'Koszt rozwoju umiejętności',
      anchor: 'koszt-rozwoju-umiejetnosci',
      content: [
        { type: 'paragraph', id: 'paragraph-4', content: 'B = 10 Punktów Umiejętności' },
        {
          type: 'table',
          id: 'table-4',
          table: {
            headers: ['Modyfikator', 'Koszt polepszenia', 'Sumaryczny koszt'],
            rows: [['k6', '0', '0'], ['k6+1', '5', '5'], ['k6+2', '10', '15']],
          },
        },
      ],
    },
  ],
};

describe('loadAiCharacterRulebookFragments', () => {
  afterEach(() => loadAllSections.mockReset());

  it('carries the rules that live in subsections, not just the section title', () => {
    loadAllSections.mockReturnValue([skillPointsSection]);

    const [fragment] = loadAiCharacterRulebookFragments('Wojak Arnold służący baronowi.');

    expect(fragment).toContain('Punkty Umiejętności');
    expect(fragment).toContain('B = 10 Punktów Umiejętności');
    // The cost table is the point: without it the model cannot judge a rank.
    expect(fragment).toContain('k6+2 | 10 | 15');
  });

  it('finds a section through its subsection title', () => {
    loadAllSections.mockReturnValue([skillPointsSection]);

    // „koszt" appears only in the subsection, never in the section title.
    expect(loadAiCharacterRulebookFragments('ile kosztuje rozwój postaci')).toHaveLength(1);
  });

  it('treats a missing rulebook as an absent context, not a failure', () => {
    loadAllSections.mockImplementation(() => { throw new Error('ENOENT'); });

    expect(loadAiCharacterRulebookFragments('cokolwiek')).toEqual([]);
  });

  it('skips a section with nothing to say', () => {
    loadAllSections.mockReturnValue([{ ...skillPointsSection, title: 'Bestiariusz', subsections: [] }]);

    expect(loadAiCharacterRulebookFragments('Wojak Arnold')).toEqual([]);
  });
});
