import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Mode } from '@/domain/characters/combat/Mode';

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

import ModesCard from '@/application/characters/combat/ModesCard';

function createMode(id: string, name: string): Mode
{
  return {
    id,
    name,
    grade: 1,
    description: `${name} description`,
    requirements: [],
    price: 0,
    tags: [],
  };
}

describe('ModesCard', () => {
  it('returns the selected mode id to the parent callback', () => {
    const onSelectedModeIdChange = vi.fn();

    render(
      <ModesCard
        name="Postawy"
        modes={[createMode('stance-1', 'Wilk'), createMode('stance-2', 'Niedźwiedź')]}
        onSelectedModeIdChange={onSelectedModeIdChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Niedźwiedź/i }));

    expect(onSelectedModeIdChange).toHaveBeenCalledWith('stance-2');
  });

  it('clears the selected mode when the none option is chosen', () => {
    const onSelectedModeIdChange = vi.fn();

    render(
      <ModesCard
        name="Stany"
        modes={[createMode('state-1', 'Ogień')]}
        selectedModeId="state-1"
        onSelectedModeIdChange={onSelectedModeIdChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'brak' }));

    expect(onSelectedModeIdChange).toHaveBeenCalledWith(undefined);
  });

  it('renders apply and withdraw buttons for linked profiles next to the selected mode', () => {
    const onApply = vi.fn();
    const onWithdraw = vi.fn();

    render(
      <ModesCard
        name="Postawy"
        modes={[createMode('stance-1', 'Wilk')]}
        selectedModeId="stance-1"
        linkedProfiles={[
          {
            id: 'profile-apply',
            name: 'Wilczy krok',
            isActive: false,
            onApply,
            onWithdraw,
          },
          {
            id: 'profile-withdraw',
            name: 'Wilczy pazur',
            isActive: true,
            onApply: vi.fn(),
            onWithdraw,
          },
        ]}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'zastosuj' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'wycofaj' })[1]);

    expect(screen.getByText('Wilczy krok')).toBeTruthy();
    expect(screen.getByText('Wilczy pazur')).toBeTruthy();
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onWithdraw).toHaveBeenCalledTimes(1);
  });
});