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
    fireEvent.click(screen.getAllByRole('button', { name: 'Usuń efekt' })[0]);
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

  it('blocks incomplete JSON and submits a later valid edit without requiring blur', async () => {
    const save = renderEditor([{ type: 'custom', effectType: 'lifesteal', data: { amount: 2 } }]);
    const json = screen.getByDisplayValue(/"amount": 2/);

    fireEvent.change(json, { target: { value: '{"amount":' } });
    fireEvent.blur(json);
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Niepoprawny JSON');
    expect(json).toHaveValue('{"amount":');
    expect(json).toHaveAttribute('aria-invalid', 'true');
    expect(save).not.toHaveBeenCalled();

    fireEvent.change(json, { target: { value: '{"amount": 5}' } });
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([
      { type: 'custom', effectType: 'lifesteal', data: { amount: 5 } },
    ]));
  });
});

describe('test-based effects', () => {
  const reflex = { group: 'attributes', key: 'reflex' };
  const basePool = { pool: [{ anyOf: [reflex] }] };

  async function choose(user: ReturnType<typeof userEvent.setup>, trigger: HTMLElement, label: string)
  {
    await user.click(trigger);
    const listbox = await screen.findByRole('listbox');
    await user.click(within(listbox).getByRole('option', { name: label }));
  }

  it('edits contested pool alternatives, terms and roll modifiers without losing win effects', async () => {
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

    const expected = {
      type: 'contested',
      attacker: { pool: [{ anyOf: [reflex, { group: 'characteristics', key: 'strength' }] }, { anyOf: [{ group: 'attributes', key: 'precision' }] }], rollMod: 'advantage' },
      defender: basePool,
      onWin: [heal],
    };
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([expected]));

    fireEvent.click(attacker.getAllByRole('button', { name: '✕' })[0]);
    fireEvent.click(attacker.getAllByRole('button', { name: 'usuń term' })[1]);
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{
      ...expected, attacker: { pool: [{ anyOf: [{ group: 'characteristics', key: 'strength' }] }], rollMod: 'advantage' },
    }]));
  });

  it('applies contested win and margin effects to the caster without changing either pool', async () => {
    const user = userEvent.setup();
    const heal = { type: 'heal', amount: { amount: 0, grade: 0, bonus: 2 } };
    const save = renderEditor([{ type: 'contested', attacker: basePool, defender: structuredClone(basePool), onWin: [heal] }]);
    const target = within(screen.getByText('efekty przy wygranej działają na').parentElement!).getByRole('combobox');
    await choose(user, target, 'siebie');
    fireEvent.click(screen.getByRole('checkbox', { name: /za każde oczko przewagi/ }));
    fireEvent.change(numberField('na ile oczek (per)'), { target: { value: '2' } });
    submit();

    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{
      type: 'contested', attacker: basePool, defender: basePool, onWin: [heal], onWinTarget: 'self',
      perMargin: { per: 2, effect: { type: 'damage', damage: { amount: 0, grade: 0, bonus: 1 }, damageType: 'zwyczajne' } },
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

describe('effect type and source changes', () => {
  async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string)
  {
    const field = within(screen.getByText(label, { exact: true }).parentElement!);
    await user.click(field.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: option }));
  }

  it('stores the chosen damage category and removes an optional checkbox value when cleared', async () => {
    const user = userEvent.setup();
    const save = renderEditor([{ type: 'damage', damage: { amount: 2, grade: 3, bonus: 1 }, damageType: 'zwyczajne' }]);
    await choose(user, 'kategoria', 'śmiertelne');
    const phantom = screen.getByRole('checkbox', { name: 'widmowa (w)' });
    const critical = screen.getByRole('checkbox', { name: 'może trafić krytycznie' });
    fireEvent.click(phantom);
    fireEvent.click(critical);
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{
      type: 'damage', damage: { amount: 2, grade: 3, bonus: 1, isPhantom: true }, damageType: 'śmiertelne', canCrit: true,
    }]));

    fireEvent.click(phantom);
    fireEvent.click(critical);
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{
      type: 'damage', damage: { amount: 2, grade: 3, bonus: 1, isPhantom: undefined }, damageType: 'śmiertelne', canCrit: undefined,
    }]));
  });

  it('replaces incompatible fields when changing an effect and saves the new profile ID', async () => {
    const user = userEvent.setup();
    const save = renderEditor([{ type: 'pull', distance: 3 }]);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Buff z profilu (zaawansowane)' }));
    expect(screen.getByRole('alertdialog')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Zachowaj efekt' })).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Zachowaj efekt' }));
    expect(numberField('kroki')).toHaveValue(3);
    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: 'Buff z profilu (zaawansowane)' }));
    await user.click(screen.getByRole('button', { name: 'Zmień typ i usuń pola' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'guard-profile' } });
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{
      type: 'buff', profile: { profileId: 'guard-profile' }, duration: 1,
    }]));
  });

  it.each([
    { label: 'gdy cel ma status', field: 'status', option: 'Zatrucie', condition: { kind: 'targetHasStatus', status: 'poisoned' } },
    { label: 'gdy masz status', field: 'status', option: 'Podpalenie', condition: { kind: 'selfHasStatus', status: 'burning' } },
    { label: 'przy trafieniu krytycznym', condition: { kind: 'onCritical' } },
    { label: 'gdy masz zasób (≥)', condition: { kind: 'hasResource', resource: 'essence', min: 1 } },
  ])('switches the condition to $label while keeping its nested effect', async ({ label, field, option, condition }) => {
    const user = userEvent.setup();
    const inner = { type: 'push', distance: 3 };
    const save = renderEditor([{ type: 'when', condition: { kind: 'opponentAttackKind', value: 'melee' }, then: [inner] }]);
    await choose(user, 'warunek', label);
    if (field && option) await choose(user, field, option);
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{ type: 'when', condition, then: [inner] }]));
  });

  it('switches back to a specific attack type without keeping the old condition fields', async () => {
    const user = userEvent.setup();
    const inner = { type: 'push', distance: 3 };
    const save = renderEditor([{ type: 'when', condition: { kind: 'hasResource', resource: 'essence', min: 4 }, then: [inner] }]);
    await choose(user, 'warunek', 'tylko przeciw (rodzaj ataku)');
    await choose(user, 'rodzaj ataku', 'dystans magiczny');
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{
      type: 'when', condition: { kind: 'opponentAttackKind', value: 'rangedMagic' }, then: [inner],
    }]));
  });

  it.each([
    { label: 'twój zasób', source: { kind: 'selfResource', resource: 'essence' } },
    { label: 'stack statusu celu', field: 'status', option: 'Zatrucie', source: { kind: 'targetStatusStacks', status: 'poisoned' } },
    { label: 'twoja statystyka', field: 'statystyka', option: 'precyzja', source: { kind: 'selfStat', group: 'attributes', key: 'precision' } },
    { label: 'niewrażliwość wroga', source: { kind: 'opponentImmunity' } },
  ])('saves the new scaling source $label without dropping its effect or limit', async ({ label, field, option, source }) => {
    const user = userEvent.setup();
    const inner = { type: 'push', distance: 1 };
    const save = renderEditor([{
      type: 'scale', source: { kind: 'opponentStat', group: 'characteristics', key: 'strength' }, per: 2, cap: 3, effect: inner,
    }]);
    await choose(user, 'za każde…', label);
    if (field && option) await choose(user, field, option);
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{ type: 'scale', source, per: 2, cap: 3, effect: inner }]));
  });

  it('stores a zero chance without dropping the conditional effect', async () => {
    const inner = { type: 'push', distance: 2 };
    const save = renderEditor([{ type: 'chance', chance: 50, then: [inner] }]);
    fireEvent.change(numberField('szansa (%)'), { target: { value: '0' } });
    submit();
    await waitFor(() => expect(save).toHaveBeenLastCalledWith([{ type: 'chance', chance: 0, then: [inner] }]));
  });
});
