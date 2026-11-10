import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { expect, it, vi } from 'vitest';
import { ManeuverEffectsEditableFields } from '../ManeuverEffectsEditableFields';

function renderManeuver(initial: Record<string, unknown>)
{
  const save = vi.fn();
  function Editor()
  {
    const form = useForm({ defaultValues: initial });
    return <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(values => save(values))}>
        <ManeuverEffectsEditableFields />
        <button type="submit">Zapisz</button>
      </form>
    </FormProvider>;
  }
  render(<Editor />);
  return save;
}

it('renders legacy defaults and updates the description when an effect is authored', () => {
  renderManeuver({});
  expect(screen.getByText('(Standardowa).')).toBeVisible();
  expect(screen.getByText('Brak efektów.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: '+ Dodaj efekt' }));
  expect(screen.getByText('(Standardowa). Zadaje 1 obrażeń zwyczajnych.')).toBeVisible();
  const bonus = within(screen.getByText('bonus').parentElement!).getByRole('spinbutton');
  fireEvent.change(bonus, { target: { value: '4' } });
  expect(screen.getByText('(Standardowa). Zadaje 4 obrażeń zwyczajnych.')).toBeVisible();
});

it('keeps the authored maneuver while moving between all simulation states', async () => {
  const user = userEvent.setup();
  const maneuver = {
    id: 'first', name: 'Odepchnięcie', description: 'Ruch', grade: 2, price: 5, tags: ['walka'],
    castTime: 'Natychmiastowa', cooldown: 2, effects: [{ type: 'push', distance: 2 }],
    simulatable: true, unsupportedReason: 'Wcześniejsza uwaga',
  };
  const save = renderManeuver(maneuver);
  const status = () => within(screen.getByText('Status symulacji').parentElement!).getByRole('combobox');
  expect(screen.getByText('Odepchnięcie (Natychmiastowa, odnowienie 2). Odpycha o 2.')).toBeVisible();
  expect(status()).toHaveTextContent('symulowalny');

  await user.click(status());
  await user.click(await screen.findByRole('option', { name: 'niesymulowalny' }));
  const reason = screen.getByRole('textbox');
  expect(reason).toHaveValue('Wcześniejsza uwaga');
  fireEvent.change(reason, { target: { value: 'Nieznany stan' } });
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith({ ...maneuver, simulatable: false, unsupportedReason: 'Nieznany stan' }));

  await user.click(status());
  await user.click(await screen.findByRole('option', { name: 'nieoceniony' }));
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ simulatable: null, effects: maneuver.effects })));

  await user.click(status());
  await user.click(await screen.findByRole('option', { name: 'symulowalny' }));
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz' }));
  await waitFor(() => expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ simulatable: true })));
});

it('shows an empty reason field for a legacy maneuver marked unsupported', () => {
  renderManeuver({ name: 'Stary manewr', simulatable: false, effects: [{ type: 'push', distance: 2 }] });
  expect(screen.getByRole('textbox')).toHaveValue('');
  expect(screen.getByText('Stary manewr (Standardowa).')).toBeVisible();
});
