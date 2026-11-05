import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { EffectListField } from '../EffectListField';
import type { LooseEffect } from '../effectFieldsMeta';

function renderEditor(initial: LooseEffect[] = [])
{
  const save = vi.fn<(effects: LooseEffect[]) => void>();

  function Editor()
  {
    const form = useForm({ defaultValues: { effects: initial } });
    return (
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(({ effects }) => save(effects))}>
          <EffectListField name="effects" />
          <button type="submit">Zapisz efekty</button>
        </form>
      </FormProvider>
    );
  }

  render(<Editor />);
  return save;
}

function numberField(label: string)
{
  const field = screen.getByText(label, { exact: true }).parentElement!;
  return within(field).getByRole('spinbutton');
}

function submit()
{
  fireEvent.click(screen.getByRole('button', { name: 'Zapisz efekty' }));
}

describe('EffectListField', () => {
  it('keeps a modified weapon-dice effect when the adjacent effect is removed', async () => {
    const save = renderEditor();
    expect(screen.getByText('Brak efektów.')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '+ Dodaj efekt' }));
    fireEvent.click(screen.getByRole('button', { name: '+ Obrażenie za kość broni (+1/kość)' }));
    fireEvent.click(screen.getAllByRole('button', { name: '✕' })[0]);
    fireEvent.change(numberField('bonus'), { target: { value: '3' } });
    submit();

    await waitFor(() => expect(save).toHaveBeenCalledWith([
      {
        type: 'scale',
        source: { kind: 'selfDice' },
        per: 1,
        effect: { type: 'damage', damage: { amount: 0, grade: 0, bonus: 3 }, damageType: 'zwyczajne', canCrit: false },
      },
    ]));
  });

  it('edits a resource condition without flattening or losing its nested effect', async () => {
    const inner = { type: 'push', distance: 2 };
    const save = renderEditor([
      { type: 'when', condition: { kind: 'hasResource', resource: 'essence', min: 1 }, then: [inner] },
    ]);

    fireEvent.change(numberField('próg (≥)'), { target: { value: '4' } });
    submit();
    await waitFor(() => expect(save).toHaveBeenCalledWith([
      { type: 'when', condition: { kind: 'hasResource', resource: 'essence', min: 4 }, then: [inner] },
    ]));
  });

  it('keeps the previous plugin data after incomplete JSON and submits a later valid edit', async () => {
    const save = renderEditor([{ type: 'custom', effectType: 'example', data: { amount: 2 } }]);
    const json = screen.getByDisplayValue(/"amount": 2/);

    fireEvent.change(json, { target: { value: '{"amount":' } });
    fireEvent.blur(json);
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([
      { type: 'custom', effectType: 'example', data: { amount: 2 } },
    ]));

    fireEvent.change(json, { target: { value: '{"amount": 5}' } });
    fireEvent.blur(json);
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([
      { type: 'custom', effectType: 'example', data: { amount: 5 } },
    ]));
  });
});

describe('test-based effects', () => {
  const reflex = { group: 'attributes', key: 'reflex' };
  const basePool = { pool: [{ anyOf: [reflex] }] };

  async function choose(user: ReturnType<typeof userEvent.setup>, trigger: HTMLElement, label: string)
  {
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: label }));
  }

  it('edits a contested pool and applies the win and margin effects to the caster', async () => {
    const user = userEvent.setup();
    const heal = { type: 'heal', amount: { amount: 0, grade: 0, bonus: 2 } };
    const save = renderEditor([{ type: 'contested', attacker: basePool, defender: structuredClone(basePool), onWin: [heal] }]);
    const attacker = within(screen.getByText('Atakujący (pula)').parentElement!);
    fireEvent.click(attacker.getByRole('button', { name: '/ alternatywa' }));
    await choose(user, attacker.getAllByRole('combobox')[1], 'siła');
    fireEvent.click(attacker.getByRole('button', { name: '+ term (do sumy)' }));
    await choose(user, attacker.getAllByRole('combobox')[2], 'precyzja');
    const roll = within(attacker.getByText('rzut', { exact: true }).parentElement!).getByRole('combobox');
    await choose(user, roll, 'przewaga');

    const target = within(screen.getByText('efekty przy wygranej działają na').parentElement!).getByRole('combobox');
    await choose(user, target, 'siebie');
    fireEvent.click(screen.getByRole('checkbox', { name: /za każde oczko przewagi/ }));
    fireEvent.change(numberField('na ile oczek (per)'), { target: { value: '2' } });
    submit();

    const expected = {
      type: 'contested',
      attacker: { pool: [{ anyOf: [reflex, { group: 'characteristics', key: 'strength' }] }, { anyOf: [{ group: 'attributes', key: 'precision' }] }], rollMod: 'advantage' },
      defender: basePool,
      onWin: [heal],
      onWinTarget: 'self',
      perMargin: { per: 2, effect: { type: 'damage', damage: { amount: 0, grade: 0, bonus: 1 }, damageType: 'zwyczajne' } },
    };
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([expected]));

    fireEvent.click(attacker.getAllByRole('button', { name: '✕' })[0]);
    fireEvent.click(attacker.getAllByRole('button', { name: 'usuń term' })[1]);
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{
      ...expected, attacker: { pool: [{ anyOf: [{ group: 'characteristics', key: 'strength' }] }], rollMod: 'advantage' },
    }]));
  });

  it('retains the failure effect when disabling save margin scaling', async () => {
    const user = userEvent.setup();
    const failure = { type: 'push', distance: 2 };
    const save = renderEditor([{
      type: 'save', pool: basePool, st: 7, onFail: [failure],
      perMarginOfFailure: { per: 1, effect: { type: 'push', distance: 1 } },
    }]);

    const roller = within(screen.getByText('kto rzuca').parentElement!).getByRole('combobox');
    await choose(user, roller, 'atakujący');
    fireEvent.change(numberField('ST (próg)'), { target: { value: '9' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /za każde oczko porażki/ }));
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{
      type: 'save', pool: basePool, st: 9, who: 'self', onFail: [failure], perMarginOfFailure: undefined,
    }]));
  });
});
