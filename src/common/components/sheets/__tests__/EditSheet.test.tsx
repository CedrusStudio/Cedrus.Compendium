import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('@/common/components/ui/sheet', () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet">{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <div data-testid="sheet-trigger">{children}</div>,
  SheetContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="sheet-content" className={className}>{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet-header">{children}</div>,
  SheetTitle: ({ children, className }: { children: React.ReactNode; className?: string }) => <h2 className={className}>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  SheetFooter: ({ children }: { children: React.ReactNode }) => <div data-testid="sheet-footer">{children}</div>,
  SheetClose: ({ children }: { children: React.ReactNode; asChild?: boolean; className?: string }) => <div>{children}</div>,
}));

vi.mock('@/common/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <button {...props as React.ButtonHTMLAttributes<HTMLButtonElement>}>{children}</button>
  ),
}));

vi.mock('@/common/components/form/SubmitButton', () => ({
  default: ({ formName }: { formName: string; isPending: boolean; className?: string }) => (
    <button type="submit" form={formName}>Submit</button>
  ),
}));

vi.mock('@/common/icons', () => ({
  editIcon: <span>✏️</span>,
}));

vi.mock('@/common/translations', () => ({
  displayedText: { clickSave: 'Click save', close: 'Close' },
}));

import { EditSheet } from '../EditSheet';

describe('EditSheet - scrollable content', () => {
  it('should render SheetContent with flex flex-col class by default', () => {
    const { getByTestId } = render(
      <EditSheet isPending={false} formId="test-form" title="Test Edit Sheet">
        <div>Child content</div>
      </EditSheet>
    );
    const content = getByTestId('sheet-content');
    expect(content.className).toContain('flex');
    expect(content.className).toContain('flex-col');
  });

  it('should render content area with overflow-y-auto and flex-1', () => {
    const { getByTestId } = render(
      <EditSheet isPending={false} formId="test-form" title="Test Edit Sheet">
        <div>Child content</div>
      </EditSheet>
    );
    const content = getByTestId('sheet-content');
    const scrollableArea = content.querySelector('.overflow-y-auto');
    expect(scrollableArea).toBeTruthy();
    expect(scrollableArea?.className).toContain('flex-1');
    expect(scrollableArea?.className).toContain('min-h-0');
    expect(scrollableArea?.className).toContain('justify-start');
  });

  it('should render footer outside the scrollable area', () => {
    const { getByTestId } = render(
      <EditSheet isPending={false} formId="test-form" title="Test Edit Sheet">
        <div>Child content</div>
      </EditSheet>
    );
    const footer = getByTestId('sheet-footer');
    const scrollableArea = getByTestId('sheet-content').querySelector('.overflow-y-auto');
    expect(scrollableArea?.contains(footer)).toBe(false);
  });

  it('should render children inside the scrollable area', () => {
    const { getByTestId, getByText } = render(
      <EditSheet isPending={false} formId="test-form" title="Test Edit Sheet">
        <div>Unique edit content</div>
      </EditSheet>
    );
    const scrollableArea = getByTestId('sheet-content').querySelector('.overflow-y-auto');
    expect(scrollableArea?.textContent).toContain('Unique edit content');
  });

  it('should use custom contentClassName when provided', () => {
    const { getByTestId } = render(
      <EditSheet isPending={false} formId="test-form" title="Test Edit Sheet" contentClassName="custom-class">
        <div>Child content</div>
      </EditSheet>
    );
    const content = getByTestId('sheet-content');
    expect(content.className).toContain('custom-class');
    expect(content.className).not.toContain('flex-col');
  });
});
