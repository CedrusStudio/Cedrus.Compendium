import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CharacterSheet from '@/application/characters/sheet/CharacterSheet';
import { SheetModel } from '@/domain/characters/sheet/sheetModel';
import { defaultSheetOptions, SheetOptions } from '@/domain/characters/sheet/sheetOptions';

const emptyModel: SheetModel =
{
  header:
  {
    name: 'Testowa Postać',
    shortName: 'Test',
    race: 'Elf',
    tags: ['postać'],
    description: '',
    descriptionIsLong: false,
    generatedOn: '2026-08-04',
  },
  characteristics: [{ key: 'strength', label: 'siła', abbr: 'SIŁ', dice: '1k6', value: 6, bonus: 0, testBonus: 0, total: 6 }],
  attributes: [{ key: 'fencing', label: 'fechtunek', abbr: 'FECH', dice: '1k8', value: 8, bonus: 1, testBonus: 2, total: 11 }],
  vitals:
  {
    totalHealth: 41,
    recoveryLevel: 5,
    rows: [{ label: 'żywotność', value: '20' }],
  },
  defenses: [],
  offenses: [],
  equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
  maneuvers: [],
  stances: [],
  states: [],
  perks: [],
  powers: [],
  talents: [],
  buffs: [],
  appendix: [],
};

function createModel(overrides: Partial<SheetModel> = {}): SheetModel
{
  return { ...emptyModel, ...overrides };
}

function renderSheet(model: SheetModel, options: SheetOptions = defaultSheetOptions)
{
  return render(<CharacterSheet model={model} options={options} />);
}

describe('CharacterSheet', () =>
{
  it('prints identity and the generation date', () =>
  {
    renderSheet(createModel());

    expect(screen.getByText('Testowa Postać')).toBeInTheDocument();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('2026-08-04')).toBeInTheDocument();
  });

  it('prints the total health', () =>
  {
    renderSheet(createModel());

    expect(screen.getByText('41')).toBeInTheDocument();
  });

  it('prints statistic components in separate cells', () =>
  {
    renderSheet(createModel());

    expect(screen.getByText('fechtunek')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();   // bonus
    expect(screen.getByText('+2')).toBeInTheDocument();   // bonus testu
    expect(screen.getByText('11')).toBeInTheDocument();   // razem
  });

  it('carries no fill-in widgets — it records data, it does not track a fight', () =>
  {
    const { container } = renderSheet(createModel());

    expect(container.querySelectorAll('.sheet-tick')).toHaveLength(0);
  });

  it('prints the description low and only when enabled', () =>
  {
    const model = createModel({ header: { ...emptyModel.header, description: 'Opis postaci.' } });

    // Unmount between renders — cleanup only runs afterEach, so a second render
    // would otherwise be asserted against the first one's DOM as well.
    const { unmount } = renderSheet(model);
    expect(screen.getByText('Opis postaci.')).toBeInTheDocument();
    unmount();

    renderSheet(model, { sections: ['stats'], appendix: false });
    expect(screen.queryByText('Opis postaci.')).not.toBeInTheDocument();
  });

  it('omits headings for empty sections', () =>
  {
    renderSheet(createModel());

    expect(screen.queryByText('obrony')).not.toBeInTheDocument();
    expect(screen.queryByText('manewry')).not.toBeInTheDocument();
    expect(screen.queryByText('ekwipunek')).not.toBeInTheDocument();
    expect(screen.queryByText('umiejętności')).not.toBeInTheDocument();
    expect(screen.queryByText('moce i zaklęcia')).not.toBeInTheDocument();
  });

  it('renders a section once it has content', () =>
  {
    renderSheet(createModel({
      maneuvers: [{ id: 'man-1', name: 'Szybki', grade: 3, castTime: 'Natychmiastowa', cooldown: 1, summary: 'Błyskawiczny manewr.' }],
    }));

    expect(screen.getByText('manewry')).toBeInTheDocument();
    expect(screen.getByText('Szybki')).toBeInTheDocument();
    expect(screen.getByText('Błyskawiczny manewr.')).toBeInTheDocument();
    // Cast times are abbreviated to keep the column narrow.
    expect(screen.getByText('Natych.')).toBeInTheDocument();
  });

  it('hides sections the caller switched off', () =>
  {
    renderSheet(createModel(), { sections: ['stats'], appendix: false });

    expect(screen.getByText('cechy')).toBeInTheDocument();
    expect(screen.queryByText('zdrowie')).not.toBeInTheDocument();
    expect(screen.queryByText('notatki')).not.toBeInTheDocument();
  });

  it('prints the appendix only when asked', () =>
  {
    const model = createModel({
      appendix: [{ title: 'manewry', entries: [{ id: 'man-1', name: 'Szybki', grade: 3, description: 'Pełny opis manewru.' }] }],
    });

    const { unmount } = renderSheet(model);
    expect(screen.queryByText('Pełny opis manewru.')).not.toBeInTheDocument();
    unmount();

    renderSheet(model, { ...defaultSheetOptions, appendix: true });
    expect(screen.getByText('Pełny opis manewru.')).toBeInTheDocument();
  });

  it('marks the default defense row', () =>
  {
    const { container } = renderSheet(createModel({
      defenses:
      [
        { id: 'def-1', name: 'Bez tarczy', isDefault: true, immunity: 0, resistance: 0, protection: 3, block: 4, parry: 5, dodge: 6, bonus: 7, fullReduction: 25, blockReduction: 14, directReduction: 10 },
        { id: 'def-2', name: 'Z tarczą', isDefault: false, immunity: 0, resistance: 0, protection: 1, block: 2, parry: 0, dodge: 0, bonus: 0, fullReduction: 3, blockReduction: 3, directReduction: 1 },
      ],
    }));

    expect(container.querySelectorAll('tr.is-default')).toHaveLength(1);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('gives the largest reference blocks their own page', () =>
  {
    const manyTalents = Array.from({ length: 20 }, (_, index) => ({
      id: `tal-${index}`,
      name: `umiejętność ${index}`,
      characteristic: 'umysł',
      display: '1k6+0',
    }));

    const { container } = renderSheet(createModel({ talents: [{ category: 'zmysł', talents: manyTalents }] }));

    expect(container.querySelectorAll('.sheet-page-break')).toHaveLength(1);
  });

  it('keeps a small reference block inline instead of spending a page on it', () =>
  {
    const { container } = renderSheet(createModel({
      talents: [{ category: 'zmysł', talents: [{ id: 'tal-1', name: 'wzrok', characteristic: 'umysł', display: '1k6+0' }] }],
    }));

    expect(screen.getByText('umiejętności')).toBeInTheDocument();
    expect(container.querySelectorAll('.sheet-page-break')).toHaveLength(0);
  });
});
