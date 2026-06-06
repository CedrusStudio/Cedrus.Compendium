import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/ui/drawer', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
  DrawerTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <h2 data-testid="drawer-title" className={className}>{children}</h2>,
}));

import CharacterManeuversViewDrawer from '@/application/bestiary/drawers/CharacterManeuversViewDrawer';
import CharacterModesViewDrawer from '@/application/bestiary/drawers/CharacterModesViewDrawer';
import CharacterSpellsViewDrawer from '@/application/bestiary/drawers/CharacterSpellsViewDrawer';
import { displayedText } from '@/common/translations';
import type { Character } from '@/domain/characters/Character';

describe('bestiary drawer accessibility', () => {
  it('renders a drawer title and empty state for modes when the character has no stances or states', () => {
    const character = {
      id: 'character-1',
      name: 'Hero',
      stances: [],
      states: [],
    } as unknown as Character;

    render(<CharacterModesViewDrawer character={character} open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId('drawer-title').textContent).toBeTruthy();
    expect(screen.getByText('Brak postaw ani stanow.')).toBeTruthy();
  });

  it('renders a drawer title and empty state for maneuvers when the character has no maneuvers', () => {
    const character = {
      id: 'character-1',
      name: 'Hero',
      maneuvers: [],
    } as unknown as Character;

    render(<CharacterManeuversViewDrawer character={character} open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId('drawer-title').textContent).toBeTruthy();
    expect(screen.getByText('Brak manewrow.')).toBeTruthy();
  });

  it('renders a drawer title and empty state for spells when the character has no spells', () => {
    const character = {
      id: 'character-1',
      name: 'Hero',
      powers: [],
    } as unknown as Character;

    render(<CharacterSpellsViewDrawer character={character} open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId('drawer-title').textContent).toBeTruthy();
    expect(screen.getByText(displayedText.no_spells_found)).toBeTruthy();
  });
});