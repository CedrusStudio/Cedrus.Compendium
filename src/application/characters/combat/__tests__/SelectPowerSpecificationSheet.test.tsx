import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const withScrollSpy = vi.fn();
const emptySearchResults: [] = [];

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: emptySearchResults }),
}));

vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value],
}));

vi.mock('@/common/hooks/useEntityTags', () => ({
  useEntityTags: () => ({ tags: [], isLoading: false }),
}));

vi.mock('@/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children, id }: { children: React.ReactNode; id?: string }) => <div data-testid="sheet-content" id={id}>{children}</div>,
  SheetFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

vi.mock('@/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button type="button">{children}</button>,
}));

vi.mock('@/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/common/components/lists/ListHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="list-header" />,
}));

vi.mock('@/common/components/WithScroll', () => ({
  WithScroll: (props: unknown) => {
    withScrollSpy(props);
    return <div data-testid="with-scroll" />;
  },
}));

vi.mock('@/common/icons', () => ({
  importIcon: <span>import</span>,
}));

vi.mock('lucide-react', () => ({
  Check: () => <span>check</span>,
}));

import { SelectPowerSpecificationSheet } from '../SelectPowerSpecificationSheet';

describe('SelectPowerSpecificationSheet', () => {
  it('uses the sheet container as the scrollable target', () => {
    render(
      <SelectPowerSpecificationSheet
        open={true}
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByTestId('sheet-content')).toHaveAttribute('id', 'select-power-specification-scrollable');
    expect(withScrollSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        scrollableTarget: 'select-power-specification-scrollable',
      })
    );
  });
});