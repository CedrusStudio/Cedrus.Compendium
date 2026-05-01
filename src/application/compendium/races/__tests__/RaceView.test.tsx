import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Race } from '@/domain/Race';

vi.mock('@/infrastructure/clients/racesClient', () => ({
  default: { update: vi.fn(), delete: vi.fn() }
}));

vi.mock('@/application/common/hooks/useDeleteEntity', () => ({
  useDeleteEntity: () => ({ deleteEntity: vi.fn(), isPending: false })
}));

vi.mock('@/application/common/SummaryView', () => ({
  default: () => <div data-testid="summary-view" />
}));

vi.mock('@/application/compendium/PerkableBadgeView', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="perkable-badge">{children}</div>
}));

vi.mock('@/application/compendium/CompendiumView', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="compendium-view">{children}</div>
}));

vi.mock('@/application/compendium/CompendiumEditView', () => ({
  default: () => null
}));

vi.mock('@/common/components/form/EditFormForSheet', () => ({
  EditFormForSheet: () => null
}));

vi.mock('@/common/components/buttons/DeleteButton', () => ({
  default: () => null
}));

vi.mock('@/common/components/sheets/EditSheet', () => ({
  EditSheet: () => null
}));

vi.mock('@/common/components/inputs/FormTagsInput', () => ({
  default: () => null
}));

vi.mock('@/common/components/form/InputFormField', () => ({
  InputFormField: () => null
}));

vi.mock('@/common/components/form/AreaInputFormField', () => ({
  default: () => null
}));

const mockRace: Race = {
  id: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
  name: 'Human',
  description: 'A versatile race',
  tags: [],
  strengthModifier: 2,
  dexterityModifier: 1,
  constitutionModifier: -1,
  mindModifier: 3,
  charismaModifier: 0,
  spellbornModifier: -2,
};

import RaceView from '../RaceView';

describe('RaceView - split characteristics table', () => {
  it('should render two separate table containers', () => {
    const { container } = render(<RaceView race={mockRace} disableEdit />);
    const tables = container.querySelectorAll('table');
    expect(tables.length).toBe(2);
  });

  it('should render strength, dexterity, constitution in first table', () => {
    const { container } = render(<RaceView race={mockRace} disableEdit />);
    const tables = container.querySelectorAll('table');
    const firstTable = tables[0];
    const secondTable = tables[1];
    const firstTableRows = firstTable.querySelectorAll('tr');
    const secondTableRows = secondTable.querySelectorAll('tr');
    // First table should have exactly 3 rows (strength, dexterity, constitution)
    expect(firstTableRows.length).toBe(3);
    // Second table should have exactly 3 rows (mind, charisma, spellborn)
    expect(secondTableRows.length).toBe(3);
    // Modifiers unique to the first table (strength=+2, dexterity=+1, constitution=-1)
    expect(firstTable.textContent).toContain('+2');
    expect(firstTable.textContent).toContain('+1');
    expect(firstTable.textContent).toContain('-1');
  });

  it('should render mind, charisma, spellborn in second table', () => {
    const { container } = render(<RaceView race={mockRace} disableEdit />);
    const tables = container.querySelectorAll('table');
    const secondTable = tables[1];
    // Modifiers unique to the second table (mind=+3, charisma=0, spellborn=-2)
    expect(secondTable.textContent).toContain('+3');
    expect(secondTable.textContent).toContain('-2');
    // +2 and +1 and -1 should NOT be in the second table
    expect(secondTable.textContent).not.toContain('+2');
    expect(secondTable.textContent).not.toContain('+1');
    expect(secondTable.textContent).not.toContain('-1');
  });

  it('should display formatted modifiers with + prefix for positive values', () => {
    const { container } = render(<RaceView race={mockRace} disableEdit />);
    expect(container.textContent).toContain('+2');
    expect(container.textContent).toContain('+1');
    expect(container.textContent).toContain('+3');
  });

  it('should display negative modifiers without + prefix', () => {
    const { container } = render(<RaceView race={mockRace} disableEdit />);
    expect(container.textContent).toContain('-1');
    expect(container.textContent).toContain('-2');
  });

  it('should render the two tables side by side in a flex row container', () => {
    const { container } = render(<RaceView race={mockRace} disableEdit />);
    const tables = container.querySelectorAll('table');
    const firstTableContainer = tables[0].closest('div[class*="flex-1"]');
    const secondTableContainer = tables[1].closest('div[class*="flex-1"]');
    expect(firstTableContainer).toBeTruthy();
    expect(secondTableContainer).toBeTruthy();
    expect(firstTableContainer?.parentElement).toBe(secondTableContainer?.parentElement);
  });
});
