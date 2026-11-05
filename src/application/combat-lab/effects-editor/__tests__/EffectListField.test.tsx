import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
