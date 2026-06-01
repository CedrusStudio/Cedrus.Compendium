import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Character } from '@/domain/characters/Character';
import { CreateEmptyCharacter } from '@/domain/characters/Character';

vi.mock('@/application/characters/combat/HealthCard', () => ({
  __esModule: true,
  default: () => <div>Health card</div>,
}));

vi.mock('@/application/characters/combat/BarrierCard', () => ({
  __esModule: true,
  default: () => <div>Barrier card</div>,
}));

vi.mock('@/application/characters/combat/DefenseCard', () => ({
  __esModule: true,
  default: () => <div>Defense card</div>,
}));

vi.mock('@/application/characters/combat/offense/OffenseCard', () => ({
  __esModule: true,
  default: () => <div>Offense card</div>,
}));

vi.mock('@/application/characters/combat/ModesCard', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div>{name}</div>,
}));

vi.mock('@/application/characters/combat/ManeuversCard', () => ({
  __esModule: true,
  default: () => <div>Maneuvers card</div>,
}));

vi.mock('@/application/characters/combat/power/PowerCard', () => ({
  __esModule: true,
  default: () => <div>Power card</div>,
}));

import CombatView from '@/application/characters/combat/CombatView';

function createCharacter(overrides: Partial<Character> = {}): Character
{
  return {
    ...CreateEmptyCharacter({
      name: 'Geralt',
      shortName: 'Ger',
      tags: [],
      description: 'Witcher',
    }),
    powers: [],
    ...overrides,
  };
}

describe('CombatView', () => {
  it('does not render the maneuvers card when the character has no maneuvers', () => {
    render(<CombatView character={createCharacter({ maneuvers: [] })} />);

    expect(screen.queryByText('Maneuvers card')).not.toBeInTheDocument();
  });

  it('does not render the modes section when the character has no stances and no states', () => {
    render(<CombatView character={createCharacter({ stances: [], states: [] })} />);

    expect(screen.queryByText('Postawy')).not.toBeInTheDocument();
    expect(screen.queryByText('Stany')).not.toBeInTheDocument();
  });

  it('renders only the mode cards that have available entries', () => {
    render(<CombatView character={createCharacter({ states: [] })} />);

    expect(screen.getByText('Postawy')).toBeInTheDocument();
    expect(screen.queryByText('Stany')).not.toBeInTheDocument();

    const modesSection = screen.getByText('Postawy').parentElement;

    expect(modesSection).not.toBeNull();
    expect(modesSection).toHaveClass('flex', 'flex-col', 'gap-3');
    expect(modesSection).not.toHaveClass('lg:grid-cols-2');
  });

  it('uses the split layout only when both stance and state cards are visible', () => {
    render(<CombatView character={createCharacter()} />);

    const modesSection = screen.getByText('Postawy').parentElement;

    expect(screen.getByText('Stany')).toBeInTheDocument();
    expect(modesSection).not.toBeNull();
    expect(modesSection).toHaveClass('lg:grid-cols-2');
  });
});