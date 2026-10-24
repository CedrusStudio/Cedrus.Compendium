import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { typedZodResolver } from '@/common/global/validation';
import { healthSchema } from '@/persistence/schemas/characters/combat/healthSchema';
import { castableSchema } from '@/persistence/schemas/characters/castableSchema';
import { InputFormField } from '../InputFormField';

const schema = z.object({ bonus: healthSchema.shape.bonus, cooldown: castableSchema.shape.cooldown });

function Fixture()
{
  const form = useForm<z.infer<typeof schema>>({ defaultValues: { bonus: 0, cooldown: 1 }, resolver: typedZodResolver(schema), mode: 'onBlur' });
  const [saved, setSaved] = useState('');
  return <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(values => setSaved(JSON.stringify(values)))}>
      <InputFormField path="bonus" numeric inputPlaceholder="bonus" />
      <InputFormField path="cooldown" numeric optional inputPlaceholder="cooldown" />
      <button type="submit">save</button><output>{saved}</output>
    </form>
  </FormProvider>;
}

describe('required and optional numeric form fields', () => {
  it('blocks blank input and saves only after explicitly entering zero', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const input = screen.getByPlaceholderText('bonus');
    await user.clear(input);
    await user.click(screen.getByText('save'));
    await screen.findByText('Uzupełnij pole');
    expect(input).toHaveValue('');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    await user.type(input, '0');
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('{"bonus":0,"cooldown":1}'));
  });

  it('does not coerce whitespace to zero', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    fireEvent.change(screen.getByPlaceholderText('bonus'), { target: { value: '  ' } });
    await user.click(screen.getByText('save'));
    await screen.findByText('Uzupełnij pole');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('allows clearing a genuinely optional number', async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    await user.clear(screen.getByPlaceholderText('cooldown'));
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('{"bonus":0}'));
    expect(screen.queryByText('Uzupełnij pole')).toBeNull();
  });
});
