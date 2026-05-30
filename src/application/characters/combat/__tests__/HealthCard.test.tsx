import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Health } from '@/domain/characters/combat/Health';
import type { Statistic } from '@/domain/characters/statistics/Statistic';

vi.mock('@/common/translations', () => ({
  displayedText: {
    health: 'Health',
    recoveryLevel: 'Recovery level',
    sum: 'Sum',
    increase: 'Increase',
    damage: 'Damage',
    barrier: 'Barrier',
    vitality: 'Vitality',
    toughness: 'Toughness',
    lethalHealth: 'Lethal health',
    lethalRounds: 'Lethal rounds',
    bonus: 'Bonus',
  },
}));

vi.mock('@/common/components/buttons/ChangeButtons', () => ({
  __esModule: true,
  default: () => <div data-testid='change-buttons' />,
}));

vi.mock('@/ui/label', () => ({
  Label: ({ children, className }: React.LabelHTMLAttributes<HTMLLabelElement>) => <label className={className}>{children}</label>,
}));

vi.mock('@/common/icons', () => ({
  gainIcon: () => <span>gain-icon</span>,
  lossIcon: () => <span>loss-icon</span>,
}));

vi.mock('@/common/components/fields', () => {
  const Field = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

  Field.Label = ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>;
  Field.Value = () => <div data-testid='field-value' />;
  Field.Info = ({ children, className }: React.HTMLAttributes<HTMLDivElement>) => <div className={className}>{children}</div>;

  return { Field };
});

import HealthCard from '@/application/characters/combat/HealthCard';

const health: Health = {
  barrier: 2,
  vitality: 12,
  toughness: 2,
  recoveryLevel: 4,
  lethalHealth: 1,
  lethalRounds: 3,
  bonus: 2,
};

const constitution: Statistic = {
  grade: 3,
  value: 4,
  bonus: 1,
  testBonus: 0,
};

const fortitude: Statistic = {
  grade: 2,
  value: 3,
  bonus: 0,
  testBonus: 0,
};

describe('HealthCard', () => {
  it('renders the recovery level badge in the card header', () => {
    render(<HealthCard health={health} constitution={constitution} fortitude={fortitude} />);

    expect(screen.getByText('PL 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Recovery level: 4')).toBeInTheDocument();
  });
});