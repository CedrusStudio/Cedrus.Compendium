import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock('@/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => <button type="button" onClick={onClick}>{children}</button>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('@/application/bestiary/drawers/CharacterModesViewDrawer', () => ({ default: () => null }));
vi.mock('@/application/bestiary/drawers/CharacterManeuversViewDrawer', () => ({ default: () => null }));
vi.mock('@/application/bestiary/drawers/CharacterPowersViewDrawer', () => ({ default: () => null }));
vi.mock('@/application/bestiary/drawers/CharacterPerksViewDrawer', () => ({ default: () => null }));

import { displayedText } from '@/common/translations';
import { MoreBattleActions } from '@/application/bestiary/columns';
import type { Character } from '@/domain/characters/Character';
import type { Power } from '@/domain/characters/combat/Power';
import { createFixedSpellCost } from '@/domain/characters/combat/SpellCost';

function createCharacter({
  powers = [],
  stances = [],
  states = [],
  maneuvers = [],
  perks = [],
}: Partial<Pick<Character, 'powers' | 'stances' | 'states' | 'maneuvers' | 'perks'>> = {}): Character {
  return {
    id: 'character-1',
    name: 'Bestiary Character',
    shortName: 'Bestiary',
    description: '',
    tags: [],
    characteristics: {} as Character['characteristics'],
    attributes: {} as Character['attributes'],
    talents: [],
    health: {} as Character['health'],
    defenses: [],
    offenses: [],
    equipment: {} as Character['equipment'],
    stances,
    states,
    maneuvers,
    powers,
    perks,
    buffProfiles: [],
    activeBuffProfileIds: [],
    stanceModifierProfiles: [],
    activeStanceModifierProfileIds: [],
    stateModifierProfiles: [],
    activeStateModifierProfileIds: [],
    otherModifierProfiles: [],
    activeOtherModifierProfileIds: [],
  } as Character;
}

function createPowerWithSpells(spellCount: number): Power {
  return {
    id: 'power-1',
    name: 'Arcana',
    type: 'moc',
    level: 1,
    bonus: 0,
    essence: 1,
    description: '',
    powerSpecificationId: '',
    spells: Array.from({ length: spellCount }, (_, index) => ({
      id: `spell-${index + 1}`,
      name: `Spell ${index + 1}`,
      description: 'Spell description',
      grade: 1,
      castTime: 'Standardowa',
      cost: createFixedSpellCost(5),
      price: 1,
      cooldown: 1,
      tags: [],
    })),
  };
}

describe('MoreBattleActions', () => {
  it('keeps the powers action and hides the spells action when the character has spells', () => {
    render(<MoreBattleActions character={createCharacter({ powers: [createPowerWithSpells(1)] })} />);

    expect(screen.getByText(displayedText.showPowers)).toBeTruthy();
    expect(screen.queryByText(displayedText.showSpells)).toBeNull();
    expect(screen.queryByText(displayedText.actions)).toBeNull();
    expect(screen.getByRole('button', { name: displayedText.actions })).toBeTruthy();
  });

  it('shows the combined modes action when the character has states but no stances', () => {
    render(<MoreBattleActions character={createCharacter({ states: [{} as Character['states'][number]] })} />);

    expect(screen.getByText(displayedText.showStancesStates)).toBeTruthy();
  });

  it('hides empty maneuver and perk actions while keeping available actions', () => {
    render(
      <MoreBattleActions
        character={createCharacter({
          states: [{} as Character['states'][number]],
          powers: [createPowerWithSpells(1)],
        })}
      />
    );

    expect(screen.getByText(displayedText.showStancesStates)).toBeTruthy();
    expect(screen.getByText(displayedText.showPowers)).toBeTruthy();
    expect(screen.queryByText(displayedText.showSpells)).toBeNull();
    expect(screen.queryByText(displayedText.showManeuvers)).toBeNull();
    expect(screen.queryByText(displayedText.showPerks)).toBeNull();
  });

  it('shows a separated duplicate action that opens the create-from-copy flow', () => {
    render(<MoreBattleActions character={createCharacter()} />);

    const duplicateLink = screen.getByRole('link', { name: displayedText.duplicateCharacter });

    expect(duplicateLink.getAttribute('href')).toBe('/characters/add?mode=copy&id=character-1');
  });

  it('does not render the actions trigger when the character has nothing to show', () => {
    render(<MoreBattleActions character={createCharacter()} />);

    expect(screen.getByRole('button', { name: displayedText.actions })).toBeTruthy();
  });
});
