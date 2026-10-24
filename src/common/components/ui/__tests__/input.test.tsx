import { createRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Input } from '../input';

function NumberInput({ initial = 0 }: { initial?: number })
{
  const [value, setValue] = useState(initial);
  return <Input aria-label="number" type="number" value={value} onChange={e => setValue(Number(e.target.value))} />;
}

describe('numeric Input', () => {
  it('lets a numeric zero stay empty until a replacement is typed', async () => {
    const user = userEvent.setup();
    render(<NumberInput />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{Backspace}');
    expect(input.value).toBe('');
    await user.keyboard('5');
    expect(input.value).toBe('5');
    await user.tab();
    expect(input.value).toBe('5');
  });

  it('keeps a cleared nonzero number blank during editing and restores the numeric fallback on blur', async () => {
    const user = userEvent.setup();
    render(<NumberInput initial={12} />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.clear(input);
    expect(input.value).toBe('');
    await user.tab();
    expect(input.value).toBe('0');
  });

  it('does not keep an empty draft after an external value changes', async () => {
    const user = userEvent.setup();
    function Fixture()
    {
      const [value, setValue] = useState(0);
      return <>
        <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} />
        <button onMouseDown={e => e.preventDefault()} onClick={() => setValue(7)}>load</button>
      </>;
    }
    render(<Fixture />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.clear(input);
    expect(input.value).toBe('');
    await user.click(screen.getByText('load'));
    expect(input.value).toBe('7');
  });

  it('preserves a field-specific minimum and reports the fallback to blur validation', async () => {
    const user = userEvent.setup();
    const onBlur = vi.fn();
    function Fixture()
    {
      const [value, setValue] = useState(12);
      return <Input type="number" value={value} min={1}
        onChange={e => setValue(Math.max(1, Number(e.target.value)))}
        onBlur={e => onBlur(e.target.value)} />;
    }
    render(<Fixture />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.clear(input);
    expect(input.value).toBe('');
    await user.tab();
    expect(input.value).toBe('1');
    expect(onBlur).toHaveBeenCalledExactlyOnceWith('1');
  });

  it('replaces an empty draft when its form field name changes', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Input numeric name="first" value={0} onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    await user.clear(input);
    expect(input).toHaveValue('');
    rerender(<Input numeric name="second" value={0} onChange={() => {}} />);
    expect(input).toHaveValue('0');
  });

  it('keeps a draft through unrelated parent renders', async () => {
    const user = userEvent.setup();
    function Fixture()
    {
      const [value, setValue] = useState(0);
      const [count, setCount] = useState(0);
      return <>
        <Input type="number" value={value} onChange={e => setValue(Number(e.target.value))} />
        <button onMouseDown={e => e.preventDefault()} onClick={() => setCount(count + 1)}>render {count}</button>
      </>;
    }
    render(<Fixture />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.clear(input);
    await user.click(screen.getByText('render 0'));
    expect(screen.getByText('render 1')).toBeVisible();
    expect(input.value).toBe('');
    expect(input).toHaveFocus();
    await user.keyboard('5');
    expect(input.value).toBe('5');
  });

  it('removes the initial zero while typing and preserves subsequent digits', async () => {
    const user = userEvent.setup();
    render(<NumberInput />);
    const input = screen.getByRole('spinbutton') as HTMLInputElement;
    await user.type(input, '5');
    expect(input.value).toBe('5');
    await user.type(input, '2');
    expect(input.value).toBe('52');
    expect(input).toHaveFocus();
  });

  it.each([[0, '00', '0'], [5, '05', '5'], [5, '0005', '5']])(
    'normalizes %s → %s even when the numeric state does not change',
    (initial, raw, expected) => {
      render(<NumberInput initial={initial as number} />);
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.change(input, { target: { value: raw } });
      expect(input.value).toBe(expected);
    },
  );

  it('passes normalized text to the handler while preserving refs and blur', () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} name="amount" type="number" defaultValue="0" onBlur={onBlur}
      onChange={e => onChange(e.target.value, e.currentTarget.value, e.target.valueAsNumber)} />);
    fireEvent.change(ref.current!, { target: { value: '0005' } });
    expect(onChange).toHaveBeenCalledExactlyOnceWith('5', '5', 5);
    expect(ref.current!.value).toBe('5');
    expect(ref.current!.name).toBe('amount');
    fireEvent.blur(ref.current!);
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('leaves ordinary text untouched', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="name" defaultValue="" />);
    await user.type(screen.getByRole('textbox'), '005');
    expect(screen.getByRole('textbox')).toHaveValue('005');
  });

  it('supports numeric text, including partial negative and decimal entries', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input numeric aria-label="bonus" onChange={e => onChange(e.target.value)} />);
    const input = screen.getByRole('textbox');
    await user.type(input, '-00.50');
    expect(input).toHaveValue('-0.50');
    expect(onChange).toHaveBeenLastCalledWith('-0.50');
    await user.clear(input);
    expect(input).toHaveValue('');
    expect(onChange).toHaveBeenLastCalledWith('');
  });

  it('formats pasted text before propagating it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input numeric aria-label="amount" onChange={e => onChange(e.target.value)} />);
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.paste('0005');
    expect(input).toHaveValue('5');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('5');
  });
});
