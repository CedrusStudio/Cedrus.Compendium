import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import LabeledFormInput from '../LabeledFormInput';

it('keeps an explicit numeric type after an onChange stores a string', async () => {
  function Fixture()
  {
    const [value, setValue] = useState<string | number>(0);
    return <LabeledFormInput name="grade" label="Grade" type="number" value={value} onChange={e => setValue(e.target.value)} />;
  }
  const user = userEvent.setup();
  render(<Fixture />);
  const input = screen.getByLabelText('Grade') as HTMLInputElement;
  await user.type(input, '5');
  expect(input.value).toBe('5');
  expect(input.type).toBe('number');
  await user.clear(input);
  await user.type(input, '0007');
  expect(input.value).toBe('7');
});
