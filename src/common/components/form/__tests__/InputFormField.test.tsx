import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { InputFormField } from '../InputFormField';

function Fixture()
{
  const form = useForm({ defaultValues: { amount: 0 as number | string, name: '' } });
  const [saved, setSaved] = useState('');
  return <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(values => setSaved(JSON.stringify(values)))}>
      <InputFormField path="amount" numeric inputPlaceholder="amount" />
      <InputFormField path="name" inputPlaceholder="name" />
      <button type="submit">save</button>
      <button type="button" onClick={() => form.reset({ amount: 0, name: '' })}>reset</button>
      <button type="button" onClick={() => form.setFocus('amount')}>focus</button>
      <output>{saved}</output>
    </form>
  </FormProvider>;
}

describe('InputFormField numeric intent', () => {
  it('keeps formatting through string edits and form reset without changing names', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const input = screen.getByPlaceholderText('amount');
    await user.type(input, '5');
    expect(input).toHaveValue('5');
    await user.clear(input);
    await user.type(input, '0007');
    expect(input).toHaveValue('7');
    await user.type(screen.getByPlaceholderText('name'), '005');
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('"amount":"7","name":"005"'));
    await user.click(screen.getByText('reset'));
    expect(input).toHaveValue('0');
    await user.type(input, '8');
    expect(input).toHaveValue('8');
    await user.click(screen.getByText('focus'));
    expect(input).toHaveFocus();
  });

  it('retains empty, negative and fractional drafts through blur and submission', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const input = screen.getByPlaceholderText('amount');
    await user.clear(input);
    expect(input).toHaveValue('');
    await user.type(input, '-00.50');
    expect(input).toHaveValue('-0.50');
    fireEvent.blur(input);
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('"amount":"-0.50"'));
  });
});
