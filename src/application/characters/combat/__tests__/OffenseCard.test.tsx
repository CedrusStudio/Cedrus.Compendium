import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import type { Offense } from '@/domain/characters/combat/Offense';

const offenseHeaderSpy = vi.fn();

vi.mock('@/common/translations', () => ({
  displayedText: {
    offense: 'Offense',
    leading: 'Leading',
    secondary: 'Secondary',
    hideDescription: 'Hide description',
    showDescription: 'Show description',
  },
}));

vi.mock('@/ui/card', () => ({
  Card: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <section className={className}>{children}</section>,
  CardHeader: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: React.HTMLAttributes<HTMLHeadingElement>) => <h2 className={className}>{children}</h2>,
}));

vi.mock('@/ui/button', () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
}));

vi.mock('@/common/icons', () => ({
  showHideIcon: (isHidden: boolean) => <span aria-hidden='true'>{isHidden ? 'show-icon' : 'hide-icon'}</span>,
}));

vi.mock('@/application/characters/combat/offense/OffenseHeader', () => ({
  __esModule: true,
  default: (props: {
    offenses: Offense[];
    selectedOffenseIndex: number;
    setSelectedOffenseIndex: (index: number) => void;
    disableInfo?: boolean;
  }) => {
    offenseHeaderSpy(props);

    return (
      <div>
        <div data-testid='roll-button'>roll</div>
        {
          props.offenses.length > 1 && (
            <div data-testid='offense-select'>
              <span>{props.offenses[props.selectedOffenseIndex]?.name}</span>
              {
                props.offenses.map((offense, index) => (
                  <button key={offense.id} type='button' onClick={() => props.setSelectedOffenseIndex(index)}>
                    {offense.name}
                  </button>
                ))
              }
            </div>
          )
        }
      </div>
    );
  },
}));

vi.mock('@/application/characters/combat/offense/WeaponDamageWithCriticalSubcard', () => ({
  WeaponDamageWithCriticalSubcard: ({ name }: { name: string }) => <div>{name}</div>,
}));

vi.mock('@/application/characters/combat/offense/DamageBonusSubcard', () => ({
  __esModule: true,
  default: () => <div>Damage bonus</div>,
}));

import OffenseCard from '@/application/characters/combat/offense/OffenseCard';

function createOffense(overrides: Partial<Offense> = {}): Offense
{
  return {
    id: 'offense-1',
    name: 'Sword Strike',
    description: 'Precise melee attack.',
    leadingWeapon: {
      amount: 1,
      grade: 4,
      bonus: 2,
      isPhantom: false,
      critical: { power: 1, range: 2 },
    },
    secondaryWeapon: undefined,
    damageBonus: {
      amount: 1,
      grade: 4,
      bonus: 0,
      isPhantom: false,
    },
    additionalDamageBonus: undefined,
    ...overrides,
  };
}

describe('OffenseCard', () => {
  it('renders nothing when there are no offenses', () => {
    const { container } = render(<OffenseCard offenses={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('offense-select')).not.toBeInTheDocument();
  });

  it('hides the offense selector when there is only one offense and shows the description by default', () => {
    render(<OffenseCard offenses={[createOffense()]} />);

    expect(screen.queryByTestId('offense-select')).not.toBeInTheDocument();
    expect(screen.getByText('Precise melee attack.')).toBeInTheDocument();
    const toggleButton = screen.getByRole('button', { name: 'Hide description' });

    expect(toggleButton).toHaveClass('absolute', 'right-0');
    expect(screen.queryByText('Hide description')).not.toBeInTheDocument();
    expect(offenseHeaderSpy.mock.calls[0][0]).toEqual(expect.objectContaining({ disableInfo: true }));
  });

  it('toggles the selected offense description visibility', async () => {
    const user = userEvent.setup();

    render(<OffenseCard offenses={[createOffense()]} />);

    await user.click(screen.getByRole('button', { name: 'Hide description' }));

    expect(screen.queryByText('Precise melee attack.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show description' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show description' }));

    expect(screen.getByText('Precise melee attack.')).toBeInTheDocument();
  });

  it('shows the selector for multiple offenses and resets the description to visible when the selection changes', async () => {
    const user = userEvent.setup();
    const firstOffense = createOffense();
    const secondOffense = createOffense({
      id: 'offense-2',
      name: 'Bow Shot',
      description: 'Careful ranged attack.',
    });

    render(<OffenseCard offenses={[firstOffense, secondOffense]} />);

    expect(screen.getByTestId('offense-select')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide description' }));

    expect(screen.queryByText('Precise melee attack.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Bow Shot' }));

    expect(screen.getByText('Careful ranged attack.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide description' })).toBeInTheDocument();
  });

  it('hides the description control when the selected offense has no description', () => {
    render(<OffenseCard offenses={[createOffense({ description: '   ' })]} />);

    expect(screen.queryByRole('button', { name: 'Hide description' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show description' })).not.toBeInTheDocument();
  });
});