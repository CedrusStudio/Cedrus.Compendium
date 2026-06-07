import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Character } from '@/domain/characters/Character';
import { createDefaultBuffProfile } from '@/domain/characters/buffs/BuffProfile';

const handleSubmitSpy = vi.fn();

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

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
    activeBuffProfileId: undefined,
    ...overrides,
  } as unknown as Character;
}

describe('CharacterBuffsView', () => {
  beforeEach(() => {
    handleSubmitSpy.mockReset();
  });

  it('submits the selected buff profile on apply and clears it on withdraw', () => {
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
          activeBuffProfileId: activeProfile.id,
        })}
      />,
    );

    expect(screen.getByText('cechy')).toBeTruthy();
    expect(screen.getByText('ofensywa')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Tarcza' }));
    fireEvent.click(screen.getByRole('button', { name: 'zastosuj' }));

    expect(handleSubmitSpy).toHaveBeenNthCalledWith(1, {
      buffProfiles: [activeProfile, secondaryProfile],
      activeBuffProfileId: secondaryProfile.id,
    });

    fireEvent.click(screen.getByRole('button', { name: 'wycofaj' }));

    expect(handleSubmitSpy).toHaveBeenNthCalledWith(2, {
      buffProfiles: [activeProfile, secondaryProfile],
      activeBuffProfileId: null,
    });
  });

  it('renders an empty state with a direct edit link when no buff profiles exist', () => {
    render(<CharacterBuffsView character={createCharacter()} />);

    expect(screen.getByText('brak zdefiniowanych profili wzmocnień')).toBeTruthy();

    const editLinks = screen.getAllByRole('link', { name: 'edycja' });
    expect(editLinks[0]).toHaveAttribute('href', '/characters/character-1/edit?tab=buffs');
  });
});