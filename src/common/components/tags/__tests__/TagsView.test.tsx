import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import TagsView from '@/common/components/tags/TagsView';

vi.mock('@/common/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  badgeVariants: () => '',
}));

function container(): HTMLElement
{
  return screen.getByText('ofensywne').parentElement as HTMLElement;
}

describe('TagsView', () => {
  it('renders nothing when there are no tags', () => {
    const { container: root } = render(<TagsView tags={[]} />);
    expect(root.innerHTML).toBe('');
  });

  it('centres by default, so existing callers are untouched', () => {
    render(<TagsView tags={['ofensywne', 'zręczność']} />);
    expect(container().className).toContain('justify-center');
    expect(container().className).not.toContain('sm:justify-start');
  });

  it('follows the card on "responsive" — centred on mobile, left from sm up (ROADMAP 6.3)', () => {
    render(<TagsView tags={['ofensywne']} align="responsive" />);
    expect(container().className).toContain('justify-center');
    expect(container().className).toContain('sm:justify-start');
  });

  it('lets a caller override the alignment through className', () => {
    // tailwind-merge resolves the conflict in favour of the caller; the old
    // string concatenation left both classes on the element.
    render(<TagsView tags={['ofensywne']} className="justify-start" />);
    expect(container().className).toContain('justify-start');
    expect(container().className).not.toContain('justify-center');
  });
});
