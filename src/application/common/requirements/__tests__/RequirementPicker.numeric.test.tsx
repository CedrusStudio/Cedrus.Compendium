import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

describe('structured requirement editing', () => {
  async function choose(user: ReturnType<typeof userEvent.setup>, trigger: HTMLElement, label: string)
  {
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: label }));
  }

  async function expectSaved(requirement: Requirement)
  {
    fireEvent.click(screen.getByRole('button', { name: 'save' }));
    await waitFor(() => expect(JSON.parse(screen.getByRole('status').textContent || 'null')).toEqual(requirement));
  }

  it('restores the draft text and ranked target after switching the requirement type', async () => {
    const user = userEvent.setup();
    render(<Fixture requirement={{ kind: 'rankless', text: 'Próba w ciemności' }} />);
    const type = () => screen.getAllByRole('combobox')[0];

    await choose(user, type(), 'Sprzęt');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await choose(user, screen.getAllByRole('combobox')[1], 'tarcza');
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '3' } });

    await choose(user, type(), 'Dowolny tekst');
    expect(screen.getByPlaceholderText('np. Zapał Wojownika')).toHaveValue('Próba w ciemności');
    await choose(user, type(), 'Sprzęt');
    expect(screen.getByRole('spinbutton')).toHaveValue(3);
    await expectSaved({ kind: 'ranked', group: 'equipment', targetKey: 'shield', value: 3 });
  });

  it.each([
    { group: 'derived', key: 'dodge', selected: 'walka dwiema broniami', expected: 'dualWield', numeric: false },
    { group: 'powers', key: 'moc', selected: 'Więź', expected: 'wiez', numeric: true },
  ] as const)('stores the selected $group target and displays a rank only when relevant', async ({ group, key, selected, expected, numeric }) => {
    const user = userEvent.setup();
    render(<Fixture requirement={{ kind: 'ranked', group, targetKey: key, value: 2 }} />);
    await choose(user, screen.getAllByRole('combobox')[1], selected);
    if (numeric) expect(screen.getByRole('spinbutton')).toHaveValue(2);
    else expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await expectSaved({ kind: 'ranked', group, targetKey: expected, value: 2 });
  });

  it('edits independent alternatives and protects the minimum of two', async () => {
    const user = userEvent.setup();
    render(<Fixture requirement={{
      kind: 'anyOf', options: [{ ...strength, value: 2 }, { kind: 'ranked', group: 'powers', targetKey: 'moc', value: 3 }],
    }} />);
    const removers = () => screen.getAllByRole('button', { name: 'Usuń alternatywę' });
    expect(removers()[0]).toBeDisabled();
    await choose(user, screen.getAllByRole('combobox')[2], 'zręczność');
    await choose(user, screen.getAllByRole('combobox')[4], 'Więź');
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj alternatywę' }));
    await choose(user, screen.getAllByRole('combobox')[5], 'Dowolny tekst');
    fireEvent.change(screen.getByPlaceholderText('np. Lekka zbroja'), { target: { value: 'Zgoda dowódcy' } });
    fireEvent.click(removers()[1]);
    expect(removers()[0]).toBeDisabled();

    await expectSaved({
      kind: 'anyOf',
      options: [{ ...strength, targetKey: 'dexterity', value: 2 }, { kind: 'rankless', text: 'Zgoda dowódcy' }],
    });
  });

  it('changes the terms of a sum without dropping the minimum or unrelated target', async () => {
    const user = userEvent.setup();
    render(<Fixture requirement={{
      kind: 'sum', targets: [{ group: 'characteristics', targetKey: 'mind' }, { group: 'characteristics', targetKey: 'dexterity' }], value: 6,
    }} />);
    const removers = () => screen.getAllByRole('button', { name: 'Usuń cechę z sumy' });
    expect(removers()[0]).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Dodaj cechę' }));
    await choose(user, screen.getAllByRole('combobox')[3], 'precyzja');
    fireEvent.click(removers()[0]);
    expect(removers()[0]).toBeDisabled();

    await expectSaved({
      kind: 'sum', targets: [{ group: 'characteristics', targetKey: 'dexterity' }, { group: 'attributes', targetKey: 'precision' }], value: 6,
    });
  });

  it('keeps at least one count group and submits the chosen group with its tag', async () => {
    render(<Fixture requirement={{ kind: 'count', groups: ['maneuvers'], value: 2 }} />);
    const maneuvers = screen.getByRole('button', { name: 'manewry' });
    const spells = screen.getByRole('button', { name: 'zaklęcia' });
    fireEvent.click(maneuvers);
    expect(maneuvers).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(spells);
    fireEvent.click(maneuvers);
    expect(maneuvers).toHaveAttribute('aria-pressed', 'false');
    fireEvent.change(screen.getByPlaceholderText('np. widmowy'), { target: { value: 'lodowy' } });
    await expectSaved({ kind: 'count', groups: ['spells'], tag: 'lodowy', value: 2 });
  });
});
