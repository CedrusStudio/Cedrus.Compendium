import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Character } from '@/domain/characters/Character';
import { createDefaultBuffProfile } from '@/domain/characters/buffs/BuffProfile';

const handleSubmitSpy = vi.fn();

vi.mock('@/infrastructure/hooks/useFormMutation', () => ({
  useFormMutation: () => ({
    handleSubmit: handleSubmitSpy,
    isPending: false,
  }),
}));

vi.mock('@/ui/select', async () => {
  const ReactModule = await import('react');
  const SelectContext = ReactModule.createContext<((value: string) => void) | null>(null);

  return {
    Select: ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => (
      <SelectContext.Provider value={onValueChange ?? null}>{children}</SelectContext.Provider>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => {
      const onValueChange = ReactModule.useContext(SelectContext);
      return <button type='button' onClick={() => onValueChange?.(value)}>{children}</button>;
    },
  };
});

import CharacterBuffsView from '@/application/characters/buffs/CharacterBuffsView';

function createCharacter(overrides?: Partial<Character>): Character
{
  return {
    id: 'character-1',
    buffProfiles: [],
    activeBuffProfileIds: [],
    stanceModifierProfiles: [],
    activeStanceModifierProfileIds: [],
    stateModifierProfiles: [],
    activeStateModifierProfileIds: [],
    otherModifierProfiles: [],
    activeOtherModifierProfileIds: [],
    ...overrides,
  } as unknown as Character;
}

describe('CharacterBuffsView', () => {
  beforeEach(() => {
    handleSubmitSpy.mockReset();
  });

  it('submits the selected buff profile on apply', () => {
    const activeProfile = {
      ...createDefaultBuffProfile(),
      id: 'buff-profile-active',
    };
    activeProfile.name = 'Furia';
    activeProfile.characteristics.strength.value = 2;
    activeProfile.offense.leadingWeapon.bonus = 3;

    const secondaryProfile = {
      ...createDefaultBuffProfile(),
      id: 'buff-profile-secondary',
    };
    secondaryProfile.name = 'Tarcza';
    secondaryProfile.defense.block = 2;

    render(
      <CharacterBuffsView
        character={createCharacter({
          buffProfiles: [activeProfile, secondaryProfile],
          activeBuffProfileIds: [activeProfile.id],
        })}
      />,
    );

    // Modifier details (per-section breakdown, incl. "cechy"/"ofensywa") live inside
    // a Radix Collapsible that's closed by default (see "fix: add sheet spell (#82)",
    // 9c4c6eb) — its content isn't in the DOM until expanded.
    // The trigger's accessible name also includes the profile description
    // span rendered inside the same button, so match on a prefix instead of
    // the exact label.
    fireEvent.click(screen.getByRole('button', { name: /^szczegóły modyfikatorów/ }));

    expect(screen.getByText('cechy')).toBeTruthy();
    expect(screen.getByText('ofensywa')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Tarcza' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'zastosuj' })[0]);

    expect(handleSubmitSpy).toHaveBeenNthCalledWith(1, {
      buffProfiles: [activeProfile, secondaryProfile],
      activeBuffProfileIds: [activeProfile.id, secondaryProfile.id],
      stanceModifierProfiles: [],
      activeStanceModifierProfileIds: [],
      stateModifierProfiles: [],
      activeStateModifierProfileIds: [],
      otherModifierProfiles: [],
      activeOtherModifierProfileIds: [],
    });
  });

  it('removes the selected active buff profile on withdraw', () => {
    const activeProfile = {
      ...createDefaultBuffProfile(),
      id: 'buff-profile-active',
    };
    activeProfile.name = 'Furia';

    const secondaryProfile = {
      ...createDefaultBuffProfile(),
      id: 'buff-profile-secondary',
    };
    secondaryProfile.name = 'Tarcza';

    render(
      <CharacterBuffsView
        character={createCharacter({
          buffProfiles: [activeProfile, secondaryProfile],
          activeBuffProfileIds: [secondaryProfile.id],
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tarcza' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'wycofaj' })[0]);

    expect(handleSubmitSpy).toHaveBeenNthCalledWith(1, {
      buffProfiles: [activeProfile, secondaryProfile],
      activeBuffProfileIds: [],
      stanceModifierProfiles: [],
      activeStanceModifierProfileIds: [],
      stateModifierProfiles: [],
      activeStateModifierProfileIds: [],
      otherModifierProfiles: [],
      activeOtherModifierProfileIds: [],
    });
  });

  it('renders an empty state without duplicating the global edit navigation', () => {
    render(<CharacterBuffsView character={createCharacter()} />);

    expect(screen.getAllByText('brak zdefiniowanych profili w tej kategorii')).toHaveLength(4);
    expect(screen.queryByRole('link', { name: 'edycja' })).toBeNull();
  });

  it('shows when a linked stance profile matches the current stance and uses the linked apply label', () => {
    const linkedProfile = {
      ...createDefaultBuffProfile(),
      id: 'stance-profile-linked',
      name: 'Wilczy krok',
      linkedEntityId: 'stance-1',
    };

    render(
      <CharacterBuffsView
        character={createCharacter({
          stances: [{ id: 'stance-1', name: 'Wilk', grade: 1, description: '', requirements: [], price: 0, tags: [] } as Character['stances'][number]],
          stanceModifierProfiles: [linkedProfile],
        })}
        selectedStanceId="stance-1"
      />,
    );

    expect(screen.getByText('powiązany z aktualnym wyborem: Wilk')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'zastosuj powiązany profil' })).toBeEnabled();
  });
});