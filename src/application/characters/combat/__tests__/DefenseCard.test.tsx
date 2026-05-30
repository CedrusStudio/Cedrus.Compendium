import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import type { Defense } from '@/domain/characters/combat/Defense';

const selectOneOfSpy = vi.fn();

vi.mock('@/common/translations', () => ({
  displayedText: {
    defense: 'Defense',
    immunity: 'Immunity',
    resistance: 'Resistance',
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

vi.mock('@/ui/label', () => ({
  Label: ({ children, className }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label className={className}>{children}</label>,
}));

vi.mock('@/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => <div data-value={value}>{children}</div>,
  SelectTrigger: ({ children, className }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button type='button' className={className}>{children}</button>,
  SelectValue: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/common/components/fields', () => {
  const Field = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  Field.Label = ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>;
  Field.Value = () => <div data-testid='field-value' />;
  Field.Info = ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>;

  return { Field };
});

vi.mock('@/common/components/buttons/ChangeButtons', () => ({
  __esModule: true,
  default: () => <div data-testid='change-buttons' />,
}));

vi.mock('@/common/components/buttons/VerticalChangeButtons', () => ({
  __esModule: true,
  default: () => <div data-testid='vertical-change-buttons' />,
}));

vi.mock('@/common/components/buttons/ResetButton', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/common/components/fields/FieldWithTooltip', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/application/characters/combat/DefenseReductionInfoContent', () => ({
  __esModule: true,
  default: () => <div data-testid='defense-reduction-info' />,
}));

vi.mock('@/common/components/selects/SelectOneOf', () => ({
  __esModule: true,
  default: (props: { items: Defense[]; index: number; setIndex: (index: number) => void; disableInfo?: boolean }) => {
    selectOneOfSpy(props);

    return (
      <div data-testid='defense-select'>
        <span>{props.items[props.index]?.name}</span>
        {
          props.items.map((item, index) => (
            <button key={item.id} type='button' onClick={() => props.setIndex(index)}>
              {item.name}
            </button>
          ))
        }
      </div>
    );
  },
}));

vi.mock('@/common/icons', () => ({
  gainIcon: () => <span>gain-icon</span>,
  immunityIcon: () => <span>immunity-icon</span>,
  lossIcon: () => <span>loss-icon</span>,
  reductionIcons: {
    full: 'full',
    block: 'block',
    direct: 'direct',
  },
  resistanceIcon: () => <span>resistance-icon</span>,
  showHideIcon: (isHidden: boolean) => <span>{isHidden ? 'show-icon' : 'hide-icon'}</span>,
}));

import DefenseCard from '@/application/characters/combat/DefenseCard';

function createDefense(overrides: Partial<Defense> = {}): Defense
{
  return {
    id: 'defense-1',
    name: 'Shield Wall',
    description: 'Steady defensive posture.',
    immunity: 2,
    resistance: 3,
    protection: 4,
    block: 5,
    parry: 6,
    dodge: 7,
    bonus: 1,
    ...overrides,
  };
}

describe('DefenseCard', () => {
  it('renders nothing when there are no defenses', () => {
    const { container } = render(<DefenseCard defenses={[]} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('defense-select')).not.toBeInTheDocument();
  });

  it('hides the defense selector when there is only one defense and shows the description by default', () => {
    render(<DefenseCard defenses={[createDefense()]} />);

    expect(screen.queryByTestId('defense-select')).not.toBeInTheDocument();
    expect(screen.getByText('Steady defensive posture.')).toBeInTheDocument();
    const toggleButton = screen.getByRole('button', { name: 'Hide description' });

    expect(toggleButton).toBeInTheDocument();
    expect(toggleButton).toHaveClass('absolute', 'right-0');
    expect(screen.queryByText('Hide description')).not.toBeInTheDocument();
  });

  it('toggles the selected defense description visibility', async () => {
    const user = userEvent.setup();

    render(<DefenseCard defenses={[createDefense()]} />);

    await user.click(screen.getByRole('button', { name: 'Hide description' }));

    expect(screen.queryByText('Steady defensive posture.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show description' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show description' }));

    expect(screen.getByText('Steady defensive posture.')).toBeInTheDocument();
  });

  it('shows the selector for multiple defenses and resets the description to visible when the selection changes', async () => {
    const user = userEvent.setup();
    const firstDefense = createDefense();
    const secondDefense = createDefense({
      id: 'defense-2',
      name: 'Iron Guard',
      description: 'Heavy armor stance.',
    });

    render(<DefenseCard defenses={[firstDefense, secondDefense]} />);

    expect(screen.getByTestId('defense-select')).toBeInTheDocument();
    expect(selectOneOfSpy.mock.calls[0][0]).toEqual(expect.objectContaining({ disableInfo: true }));

    await user.click(screen.getByRole('button', { name: 'Hide description' }));

    expect(screen.queryByText('Steady defensive posture.')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Iron Guard' }));

    expect(screen.getByText('Heavy armor stance.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hide description' })).toBeInTheDocument();
  });

  it('hides the description control when the selected defense has no description', () => {
    render(<DefenseCard defenses={[createDefense({ description: '   ' })]} />);

    expect(screen.queryByRole('button', { name: 'Hide description' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show description' })).not.toBeInTheDocument();
  });
});