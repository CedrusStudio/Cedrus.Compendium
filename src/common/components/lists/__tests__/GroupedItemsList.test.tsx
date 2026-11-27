import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import GroupedItemsList from '../GroupedItemsList';

it('renders no accordion when a filter has no matching groups', () => {
  const { container } = render(<GroupedItemsList items={[]} renderItem={() => null} hasMore={false} triggerNext={vi.fn()} />);
  expect(container).toBeEmptyDOMElement();
});

it('cancels a pending next-page request when leaving the list', () => {
  vi.useFakeTimers();
  try {
    const triggerNext = vi.fn();
    const view = render(<GroupedItemsList
      items={[{ id: 'a', name: 'Akrobatyka', grade: 1 }]}
      renderItem={item => <p key={item.id}>{item.name}</p>}
      hasMore
      triggerNext={triggerNext}
    />);
    view.unmount();
    vi.advanceTimersByTime(200);
    expect(triggerNext).not.toHaveBeenCalled();
  } finally {
    vi.useRealTimers();
  }
});

it('opens and filters a group using separate keyboard controls', async () => {
  const user = userEvent.setup();
  const onScopeToGroup = vi.fn();
  function GroupSearch() {
    const [groupName, setGroupName] = useState<string | null>(null);
    return <GroupedItemsList
      items={[{ id: 'a', name: 'Akrobatyka', grade: 1 }, { id: 'b', name: 'Akrobatyka bojowa', grade: 2 }]}
      renderItem={item => <p key={item.id}>Opis pozycji</p>}
      triggerNext={vi.fn()}
      hasMore={false}
      groupName={groupName}
      onScopeToGroup={name => { setGroupName(name); onScopeToGroup(name); }}
    />;
  }
  render(<GroupSearch />);
  const toggle = screen.getByRole('button', { name: /^Akrobatyka\s*1$/ });
  const scope = screen.getByRole('button', { name: 'Zawęź do grupy „Akrobatyka”' });
  expect(toggle).not.toContainElement(scope);
  await user.tab();
  expect(toggle).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(onScopeToGroup).not.toHaveBeenCalled();
  await user.tab();
  expect(scope).toHaveFocus();
  await user.keyboard(' ');
  expect(scope).toBeDisabled();
  await user.dblClick(scope);
  expect(onScopeToGroup).toHaveBeenCalledExactlyOnceWith('Akrobatyka');
  expect(screen.getByText('Opis pozycji')).toBeVisible();
  expect(screen.queryByText('Akrobatyka bojowa')).not.toBeInTheDocument();
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await user.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(scope).toBeDisabled();
});
