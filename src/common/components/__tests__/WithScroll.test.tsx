import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WithScroll } from '../WithScroll';

vi.mock('react-infinite-scroll-component', () => ({ default: ({ children }: React.PropsWithChildren) => <>{children}</> }));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('WithScroll autofill', () => {
  it('checks its sheet scroll container instead of the taller document', () => {
    vi.useFakeTimers();
    const next = vi.fn();
    const view = render(<div id="picker-list"><WithScroll items={['item']} triggerNext={next} hasMore scrollableTarget="picker-list" renderItem={item => <p key={item}>{item}</p>} /></div>);
    const target = document.getElementById('picker-list')!;
    Object.defineProperty(target, 'clientHeight', { configurable: true, value: 300 });
    Object.defineProperty(target, 'scrollHeight', { configurable: true, value: 100 });
    act(() => { window.dispatchEvent(new Event('resize')); vi.advanceTimersByTime(100); });
    expect(next).toHaveBeenCalledTimes(1);
    view.unmount();
  });

  it('cancels pending autofill when the list unmounts', () => {
    vi.useFakeTimers();
    const next = vi.fn();
    const view = render(<WithScroll items={['item']} triggerNext={next} hasMore renderItem={item => <p key={item}>{item}</p>} />);
    view.unmount();
    act(() => vi.advanceTimersByTime(100));
    expect(next).not.toHaveBeenCalled();
  });
});
