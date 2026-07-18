import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

const formTagsInputSpy = vi.fn();

// Partial mock: keep the real module (FormProvider, useForm, ...) so that
// GenerateOffensesFromFormulaSheet — introduced by "feat: specification
// formulas (#60)", c7aa342, after this test/mock was last touched — can use
// its own real useForm()/FormProvider, while still stubbing useFormContext/
// useFieldArray for the component under test.
vi.mock('react-hook-form', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-hook-form')>();

  return {
    ...actual,
    useFormContext: () => ({ control: {} }),
    useFieldArray: () => ({
      fields: [],
      append: vi.fn(),
      remove: vi.fn(),
    }),
  };
});

vi.mock('@/common/translations', () => ({
  displayedText: {
    name: 'name',
    description: 'description',
    changeName: 'change name',
    changeDescription: 'change description',
  },
}));

vi.mock('@/common/components/form/InputFormField', () => ({
  InputFormField: () => <div data-testid="input-form-field" />,
}));

vi.mock('@/common/components/form/AreaInputFormField', () => ({
  default: () => <div data-testid="area-input-form-field" />,
}));

vi.mock('@/common/components/inputs/FormTagsInput', () => ({
  __esModule: true,
  default: (props: unknown) => {
    formTagsInputSpy(props);
    return <div data-testid="form-tags-input" />;
  },
}));

vi.mock('@/ui/label', () => ({
  Label: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
}));

vi.mock('@/common/components/form/AppendToArrayButton', () => ({
  default: () => <button type="button">append</button>,
}));

vi.mock('@/common/components/form/RemoveFromArrayButton', () => ({
  default: () => <button type="button">remove</button>,
}));

vi.mock('@/application/common/combat/usePowerOffenseForm', () => ({
  usePowerOffenseForm: () => ({
    spellOffense: {
      amount: 0,
      grade: 1,
      bonus: 0,
      isPhantom: false,
      power: 0,
      range: 0,
      setAmount: vi.fn(),
      setGrade: vi.fn(),
      setBonus: vi.fn(),
      setIsPhantom: vi.fn(),
      setPower: vi.fn(),
      setRange: vi.fn(),
    },
    spellDamage: {
      amount: 0,
      grade: 1,
      bonus: 0,
      isPhantom: false,
      setAmount: vi.fn(),
      setGrade: vi.fn(),
      setBonus: vi.fn(),
      setIsPhantom: vi.fn(),
    },
  }),
}));

vi.mock('@/common/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <div />,
}));

vi.mock('@/common/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/application/characters/edit/combat/offense/EditWeaponDamageView', () => ({
  default: () => <div />,
}));

vi.mock('@/application/characters/edit/combat/offense/EditDamageBonusView', () => ({
  default: () => <div />,
}));

vi.mock('@/application/characters/edit/combat/offense/EditCriticalView', () => ({
  default: () => <div />,
}));

import PowerSpecificationEditableFields from '../PowerSpecificationEditableFields';

describe('PowerSpecificationEditableFields', () => {
  beforeEach(() => {
    formTagsInputSpy.mockClear();
  });

  it('passes the powerSpecifications entity type to FormTagsInput', () => {
    render(<PowerSpecificationEditableFields />);

    expect(screen.getByTestId('form-tags-input')).toBeTruthy();
    expect(formTagsInputSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'tags',
        entityType: 'powerSpecifications',
      }),
    );
  });
});