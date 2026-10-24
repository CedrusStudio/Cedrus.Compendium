import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import type { Requirement } from '@/domain/requirements/Requirement';
import { requirementSchema } from '@/persistence/schemas/requirementSchema';
import RequirementPicker from '../RequirementPicker';
import { z } from 'zod';
import { typedZodResolver } from '@/common/global/validation';

function Fixture({ requirement }: { requirement: Requirement })
{
  const form = useForm({ defaultValues: { structuredRequirements: [requirement] },
    resolver: typedZodResolver(z.object({ structuredRequirements: z.array(requirementSchema) })), mode: 'onBlur' });
  const [saved, setSaved] = useState('');
  return <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(values => setSaved(JSON.stringify(requirementSchema.parse(values.structuredRequirements[0]))))}>
      <RequirementPicker name="structuredRequirements.0" />
      <button type="submit">save</button>
      <output>{saved}</output>
    </form>
  </FormProvider>;
}

const strength = { kind: 'ranked', group: 'characteristics', targetKey: 'strength', value: 0 } as const;
const cases: { label: string; requirement: Requirement; index: number; expected: Requirement }[] = [
  { label: 'strength threshold', requirement: strength, index: 0, expected: { ...strength, value: 5 } },
  { label: 'alternative threshold', requirement: { kind: 'anyOf', options: [strength, { ...strength, targetKey: 'dexterity' }] }, index: 0,
    expected: { kind: 'anyOf', options: [{ ...strength, value: 5 }, { ...strength, targetKey: 'dexterity' }] } },
  { label: 'sum threshold', requirement: { kind: 'sum', targets: [{ group: 'characteristics', targetKey: 'strength' }, { group: 'characteristics', targetKey: 'dexterity' }], value: 0 }, index: 0,
    expected: { kind: 'sum', targets: [{ group: 'characteristics', targetKey: 'strength' }, { group: 'characteristics', targetKey: 'dexterity' }], value: 5 } },
  { label: 'count threshold', requirement: { kind: 'count', groups: ['maneuvers'], value: 0 }, index: 1,
    expected: { kind: 'count', groups: ['maneuvers'], value: 5 } },
];

describe('numeric requirement fields', () => {
  it.each(cases)('blocks a blank $label and accepts an explicitly entered zero', async ({ requirement, index }) => {
    const user = userEvent.setup();
    render(<Fixture requirement={requirement} />);
    const input = screen.getAllByRole('spinbutton')[index] as HTMLInputElement;
    await user.clear(input);
    await user.click(screen.getByText('save'));
    expect(input.value).toBe('');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Uzupełnij pole'));
    expect(screen.getByRole('status').textContent).toBe('');
    await user.type(input, '0');
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(screen.getByRole('status').textContent).not.toBe(''));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each(cases)('formats $label while submitting numbers', async ({ requirement, index, expected }) => {
    const user = userEvent.setup();
    render(<Fixture requirement={requirement} />);
    const input = screen.getAllByRole('spinbutton')[index] as HTMLInputElement;
    await user.clear(input);
    expect(input.value).toBe('');
    await user.type(input, '5');
    expect(input.value).toBe('5');
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(JSON.stringify(expected)));
  });

  it('normalizes the optional minimum grade and still permits clearing it', async () => {
    const user = userEvent.setup();
    render(<Fixture requirement={{ kind: 'count', groups: ['stances'], value: 2, minGrade: 0 }} />);
    const input = screen.getAllByRole('spinbutton')[0] as HTMLInputElement;
    await user.type(input, '5');
    expect(input.value).toBe('5');
    await user.clear(input);
    expect(input.value).toBe('');
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe(JSON.stringify({ kind: 'count', groups: ['stances'], value: 2 })));
  });
});
