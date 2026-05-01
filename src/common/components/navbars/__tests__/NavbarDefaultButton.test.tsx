import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock('@/common/components/navbars/ThemeMode', () => ({
  __esModule: true,
  default: () => <div data-testid="theme-mode" />,
}));

import NavbarDefaultButton from '@/common/components/navbars/NavbarDefaultButton';

describe('NavbarDefaultButton', () => {
  it('renders a link to the personalization page next to the home button', () => {
    render(<NavbarDefaultButton />);

    expect(screen.getByRole('link', { name: 'Personalization' })).toHaveAttribute('href', '/personalization');
  });
});