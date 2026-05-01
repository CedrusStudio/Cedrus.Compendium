import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { displayedText } from '@/common/translations';

vi.mock('@/common/components/inputs/ExistingRequirementDropdown', () => ({
  __esModule: true,
  default: ({ onSelectRequirement }: { onSelectRequirement: (requirement: string) => void }) => (
    <button type="button" onClick={() => onSelectRequirement('focus')}>select existing requirement</button>
  ),
}));

import FormStringsInput from '@/common/components/inputs/FormStringsInput';

type FormValues = {
  requirements: string[];
};

function renderWithForm(ui: React.ReactElement, defaultValues: FormValues = { requirements: [] })
{
  function Wrapper({ children }: { children: React.ReactNode })
  {
    const methods = useForm<FormValues>({ defaultValues });
    return <FormProvider {...methods}>{children}</FormProvider>;
  }

  return render(ui, { wrapper: Wrapper });
}

describe('FormStringsInput', () => {
  it('appends an existing requirement selected from the dropdown', () => {
    renderWithForm(
      <FormStringsInput<FormValues>
        path="requirements"
        placeholder={displayedText.addRequirement}
        entityType="perks"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'select existing requirement' }));

    expect(screen.getByRole('button', { name: 'Remove focus' })).toBeTruthy();
  });

  it('keeps manual requirement entry working when the selector is enabled', () => {
    renderWithForm(
      <FormStringsInput<FormValues>
        path="requirements"
        placeholder={displayedText.addRequirement}
        entityType="perks"
      />,
    );

    const input = screen.getByPlaceholderText(displayedText.addRequirement);
    fireEvent.change(input, { target: { value: 'alchemy' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByRole('button', { name: 'Remove alchemy' })).toBeTruthy();
  });

  it('rejects duplicate selection from the existing requirements dropdown', () => {
    renderWithForm(
      <FormStringsInput<FormValues>
        path="requirements"
        placeholder={displayedText.addRequirement}
        entityType="perks"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'select existing requirement' }));
    fireEvent.click(screen.getByRole('button', { name: 'select existing requirement' }));

    expect(screen.getByText(displayedText.stringAlreadyExists)).toBeTruthy();
  });
});